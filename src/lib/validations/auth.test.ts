import { describe, expect, it } from "vitest";

import { registerSchema } from "@/lib/validations/auth";

const TOO_LONG = "Password is too long (at most 72 characters, fewer with emoji or accented letters)";

function register(password: string) {
  return registerSchema.safeParse({
    name: "Demo",
    email: "demo@test.com",
    password,
    confirmPassword: password,
  });
}

describe("new password length", () => {
  it("accepts 72 ASCII characters and rejects 73", () => {
    expect(register("a".repeat(72)).success).toBe(true);
    expect(register("a".repeat(73)).error?.issues[0]?.message).toBe(TOO_LONG);
  });

  it("counts bytes, so multibyte characters reach bcrypt's limit sooner", () => {
    // "é" is 2 bytes and the emoji is 4, so these are 72 and 76 bytes.
    expect(register("é".repeat(36)).success).toBe(true);
    expect(register("🔑".repeat(19)).error?.issues[0]?.message).toBe(TOO_LONG);
  });

  it("still requires at least 8 characters", () => {
    expect(register("short").error?.issues[0]?.message).toBe(
      "Password must be at least 8 characters",
    );
  });
});
