import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api-response";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { GENERIC_ERROR } from "@/lib/messages";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitMessage,
  getRetryAfterSeconds,
} from "@/lib/rate-limit";
import { sendVerificationOrRollback } from "@/lib/registration";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const limit = await checkRateLimit("register", getClientIp(request.headers));
  if (!limit.success) {
    return jsonError(getRateLimitMessage(limit.reset), 429, {
      headers: { "Retry-After": String(getRetryAfterSeconds(limit.reset)) },
    });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return jsonError("An account with this email already exists", 409);

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });

    const verificationRequired = isEmailVerificationEnabled();
    if (verificationRequired && !(await sendVerificationOrRollback(user))) {
      return jsonError("We couldn't send the verification email. Please try again.", 502);
    }

    return NextResponse.json(
      { success: true, data: { ...user, verificationRequired } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration failed", error);
    return jsonError(GENERIC_ERROR, 500);
  }
}
