import { NextResponse } from "next/server";

// The `{ success: false, error }` body API routes send with an error status.
export function jsonError(error: string, status: number, init?: Omit<ResponseInit, "status">) {
  return NextResponse.json({ success: false, error }, { ...init, status });
}
