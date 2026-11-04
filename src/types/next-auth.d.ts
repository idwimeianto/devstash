import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt re-exports this module, so the JWT interface is augmented at its source.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
  }
}
