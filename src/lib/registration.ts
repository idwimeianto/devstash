import { getAppUrl } from "@/lib/app-url";
import { createVerificationToken } from "@/lib/db/verification-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Emails a new user their verification link. Without it the account could never be verified,
// so when the token or the email fails, the user and their tokens are removed again and the
// person can register once more. Returns whether the email went out.
export async function sendVerificationOrRollback(user: { id: string; email: string }) {
  try {
    const token = await createVerificationToken(user.email);
    await sendVerificationEmail(
      user.email,
      `${getAppUrl()}/api/auth/verify-email?token=${token}`,
    );
    return true;
  } catch (error) {
    console.error("Verification email failed", error);
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: user.email } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    return false;
  }
}
