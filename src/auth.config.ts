import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

export const CREDENTIALS_FIELDS = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
};

// Edge-compatible config shared by the proxy and `auth.ts`: no adapter or database access here.
// `auth.ts` replaces the Credentials placeholder with the real password check.
export default {
  providers: [
    GitHub,
    Credentials({ credentials: CREDENTIALS_FIELDS, authorize: () => null }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
