import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVerificationToken } from "@/lib/db/verification-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendVerificationOrRollback } from "@/lib/registration";

vi.mock("@/lib/app-url", () => ({ getAppUrl: () => "https://devstash.test" }));
vi.mock("@/lib/db/verification-tokens", () => ({ createVerificationToken: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    verificationToken: { deleteMany: vi.fn() },
    user: { delete: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const USER = { id: "user_1", email: "new@test.com" };

describe("sendVerificationOrRollback", () => {
  beforeEach(() => {
    vi.mocked(createVerificationToken).mockResolvedValue("tok_123");
    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);
  });

  it("emails the verification link and keeps the user", async () => {
    await expect(sendVerificationOrRollback(USER)).resolves.toBe(true);

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      USER.email,
      "https://devstash.test/api/auth/verify-email?token=tok_123",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("removes the user and their tokens when the email fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendVerificationEmail).mockRejectedValue(new Error("Resend refused"));

    await expect(sendVerificationOrRollback(USER)).resolves.toBe(false);

    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: USER.email },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: USER.id } });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("also rolls back when the token can't be created", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createVerificationToken).mockRejectedValue(new Error("connection lost"));

    await expect(sendVerificationOrRollback(USER)).resolves.toBe(false);

    expect(sendVerificationEmail).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: USER.id } });
  });
});
