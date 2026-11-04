import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, deleteAccount } from "@/actions/profile";
import { signOut } from "@/auth";
import { cancelSubscription } from "@/lib/billing";
import { getSessionUserId } from "@/lib/db/users";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";

vi.mock("@/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/billing", () => ({ cancelSubscription: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
vi.mock("@/lib/db/verification-tokens", () => ({ deleteTokensForEmail: vi.fn() }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));
// Keep the real URL helpers; only the calls to R2 are faked.
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  deleteObject: vi.fn(),
}));

const USER_ID = "user_1";
const PUBLIC_URL = "https://pub-test.r2.dev";

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

describe("deleteAccount", () => {
  const FILE_URLS = [`${PUBLIC_URL}/${USER_ID}/a.png`, `${PUBLIC_URL}/${USER_ID}/b.pdf`];

  beforeEach(() => {
    vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "user@test.com",
      stripeSubscriptionId: null,
      items: FILE_URLS.map((fileUrl) => ({ fileUrl })),
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
    vi.mocked(deleteObject).mockResolvedValue(undefined as never);
  });

  function withSubscription() {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "pro@test.com",
      stripeSubscriptionId: "sub_1",
      items: [],
    } as never);
  }

  it("deletes the user, then their uploaded files, then signs out", async () => {
    await deleteAccount();

    expect(cancelSubscription).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(vi.mocked(deleteObject).mock.calls).toEqual([[`${USER_ID}/a.png`], [`${USER_ID}/b.pdf`]]);
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });

  it("cancels a Pro user's subscription before deleting the account", async () => {
    withSubscription();
    const order: string[] = [];
    vi.mocked(cancelSubscription).mockImplementation(async () => {
      order.push("cancel");
    });
    vi.mocked(prisma.$transaction).mockImplementation(async () => {
      order.push("delete");
      return [] as never;
    });

    await deleteAccount();

    expect(cancelSubscription).toHaveBeenCalledWith("sub_1");
    expect(order).toEqual(["cancel", "delete"]);
    expect(signOut).toHaveBeenCalled();
  });

  it("keeps the account when canceling the subscription fails", async () => {
    withSubscription();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(cancelSubscription).mockRejectedValue(new Error("Stripe down"));

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("keeps the files when deleting the user fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("connection lost"));

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
    expect(deleteObject).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("still signs out when deleting a file from R2 fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(deleteObject).mockRejectedValueOnce(new Error("R2 down"));

    await deleteAccount();

    expect(deleteObject).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue("");

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "You're not signed in. Please sign in again." });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
