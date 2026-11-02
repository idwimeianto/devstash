import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import authConfig, { CREDENTIALS_FIELDS } from "@/auth.config";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { EMAIL_NOT_VERIFIED, signInSchema } from "@/lib/validations/auth";

class EmailNotVerifiedError extends CredentialsSignin {
  code = EMAIL_NOT_VERIFIED;
}

const credentials = Credentials({
  credentials: CREDENTIALS_FIELDS,
  async authorize(input) {
    const parsed = signInSchema.safeParse(input);
    if (!parsed.success) return null;

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
    if (!user.emailVerified) throw new EmailNotVerifiedError();

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
