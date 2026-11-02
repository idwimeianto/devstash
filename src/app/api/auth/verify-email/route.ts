import { NextResponse, type NextRequest } from "next/server";

import { verifyEmailToken, type VerifyEmailResult } from "@/lib/db/verification-tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let result: VerifyEmailResult = "invalid";
  if (token) {
    try {
      result = await verifyEmailToken(token);
    } catch (error) {
      console.error("Email verification failed", error);
    }
  }

  const statusUrl = new URL("/verify-email", request.nextUrl.origin);
  statusUrl.searchParams.set("status", result);
  return NextResponse.redirect(statusUrl);
}
