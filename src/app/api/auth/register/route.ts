import { NextResponse } from "next/server";

import { getAppUrl } from "@/lib/app-url";
import { createVerificationToken } from "@/lib/db/verification-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });

    try {
      const token = await createVerificationToken(email);
      await sendVerificationEmail(
        email,
        `${getAppUrl()}/api/auth/verify-email?token=${token}`,
      );
    } catch (error) {
      // Without the email the account can never be verified, so remove it and let them retry.
      console.error("Verification email failed", error);
      await prisma.$transaction([
        prisma.verificationToken.deleteMany({ where: { identifier: email } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send the verification email. Please try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
