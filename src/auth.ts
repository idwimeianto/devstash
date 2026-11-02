import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { CREDENTIALS_FIELDS } from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/email-verification";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  EMAIL_NOT_VERIFIED,
  SIGN_IN_RATE_LIMITED,
  signInSchema,
} from "@/lib/validations/auth";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

export class SignInRateLimitedError extends CredentialsSignin {
  code = SIGN_IN_RATE_LIMITED;

  constructor(readonly reset: number) {
    super();
  }
}

const credentials = Credentials({
  credentials: CREDENTIALS_FIELDS,
  // Limited here rather than in the sign-in action, so direct POSTs to the
  // credentials callback are covered too.
  async authorize(input, request) {
    const parsed = signInSchema.safeParse(input);
    if (!parsed.success) return null;

    const limit = await checkRateLimit(
      "login",
      `${getClientIp(request.headers)}:${parsed.data.email}`,
    );
    if (!limit.success) throw new SignInRateLimitedError(limit.reset);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        password: true,
        emailVerified: true,
      },
    });
    // OAuth-only users have no password and can't sign in this way.
    if (!user?.password) return null;
    if (!(await verifyPassword(parsed.data.password, user.password))) return null;
    // Checked after the password so verification status isn't revealed to anyone else.
    if (isEmailVerificationEnabled() && !user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    return { id: user.id, name: user.name, email: user.email, image: user.image };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: authConfig.providers.map((provider) =>
    typeof provider !== "function" && provider.id === "credentials"
      ? credentials
      : provider,
  ),
});
