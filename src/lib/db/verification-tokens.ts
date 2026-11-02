import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type VerifyEmailResult = "verified" | "expired" | "invalid";

// Only the hash is stored, so a leaked database can't be used to verify accounts.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Replaces any earlier token for this email and returns the raw token for the link.
export async function createVerificationToken(email: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashToken(token),
        expires: new Date(Date.now() + TOKEN_TTL_MS),
      },
    }),
  ]);

  return token;
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const record = await prisma.verificationToken.findFirst({
    where: { token: hashToken(token) },
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
