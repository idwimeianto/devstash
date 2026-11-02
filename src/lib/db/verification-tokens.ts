import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

// Reset tokens share the table with email verification tokens; the prefix keeps the two
// apart, so neither kind can be used as the other or replace the other.
const PASSWORD_RESET_PREFIX = "password-reset:";

export type VerifyEmailResult = "verified" | "expired" | "invalid";
export type PasswordResetTokenStatus = "valid" | "expired" | "invalid";
export type ResetPasswordResult = "reset" | "expired" | "invalid";

// Only the hash is stored, so a leaked database can't be used to verify accounts.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordResetIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${email}`;
}

// Replaces any earlier token for this identifier and returns the raw token for the link.
async function issueToken(identifier: string, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

export function createVerificationToken(email: string): Promise<string> {
  return issueToken(email, TOKEN_TTL_MS);
}

export function createPasswordResetToken(email: string): Promise<string> {
  return issueToken(passwordResetIdentifier(email), PASSWORD_RESET_TTL_MS);
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      NOT: { identifier: { startsWith: PASSWORD_RESET_PREFIX } },
    },
  });
  if (!record) return "invalid";

  const where = { identifier_token: { identifier: record.identifier, token: record.token } };

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where });
    return "expired";
  }

  const [{ count }] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where }),
  ]);

  return count > 0 ? "verified" : "invalid";
}

function findPasswordResetRecord(token: string) {
  return prisma.verificationToken.findFirst({
    where: {
      token: hashToken(token),
      identifier: { startsWith: PASSWORD_RESET_PREFIX },
    },
  });
}

// Read-only check so the reset page can show the expired / invalid states up front.
export async function getPasswordResetTokenStatus(
  token: string,
): Promise<PasswordResetTokenStatus> {
  const record = await findPasswordResetRecord(token);
  if (!record) return "invalid";
  return record.expires < new Date() ? "expired" : "valid";
}

export async function resetPasswordWithToken(
  token: string,
  passwordHash: string,
): Promise<ResetPasswordResult> {
  const record = await findPasswordResetRecord(token);
  if (!record) return "invalid";

  const { identifier } = record;
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { identifier, token: record.token } });
    return "expired";
  }

  const email = identifier.slice(PASSWORD_RESET_PREFIX.length);

  return prisma.$transaction(async (tx) => {
    // Deleting first makes the token single-use: a concurrent reset deletes nothing and stops.
    const { count: deleted } = await tx.verificationToken.deleteMany({
      where: { identifier, token: record.token },
    });
    if (deleted === 0) return "invalid";

    const { count: updated } = await tx.user.updateMany({
      where: { email },
      data: { password: passwordHash },
    });
    if (updated === 0) return "invalid";

    // Opening the emailed link proves the user owns the address.
    await tx.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    });

    return "reset";
  });
}
