import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword } from "@/actions/profile";
import { getSessionUserId } from "@/lib/db/users";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

vi.mock("@/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
vi.mock("@/lib/db/verification-tokens", () => ({ deleteTokensForEmail: vi.fn() }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

const USER_ID = "user_1";

function passwordForm(fields: Partial<Record<string, string>> = {}) {
  const formData = new FormData();
  const values = {
    currentPassword: "old-password",
    password: "new-password",
    confirmPassword: "new-password",
    ...fields,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) formData.set(key, value);
  }
  return formData;
}

describe("changePassword", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "old-hash" } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue("new-hash");
  });

  it("updates the session user's password", async () => {
    const result = await changePassword(null, passwordForm());

    expect(result).toEqual({ success: true, data: { message: "Password updated." } });
    expect(verifyPassword).toHaveBeenCalledWith("old-password", "old-hash");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { password: "new-hash" },
    });
  });

  it("returns field errors for invalid input without touching the database", async () => {
    const result = await changePassword(
      null,
      passwordForm({ password: "short", confirmPassword: "different" }),
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toEqual(["Password must be at least 8 characters"]);
    expect(result.fieldErrors?.confirmPassword).toEqual(["Passwords do not match"]);
    expect(getSessionUserId).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("");

    const result = await changePassword(null, passwordForm());

    expect(result).toEqual({
      success: false,
      error: "You're not signed in. Please sign in again.",
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an account without a password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: null } as never);

    const result = await changePassword(null, passwordForm());

    expect(result).toEqual({
      success: false,
      error: "This account signs in with GitHub and has no password.",
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a wrong current password", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await changePassword(null, passwordForm());

    expect(result).toEqual({
      success: false,
      fieldErrors: { currentPassword: ["Current password is incorrect"] },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(prisma.user.update).mockRejectedValue(new Error("connection lost"));

    const result = await changePassword(null, passwordForm());

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});
