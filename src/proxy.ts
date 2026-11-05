import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const AUTH_PAGES = ["/sign-in", "/register", "/forgot-password", "/reset-password"];

export const proxy = auth((req) => {
  const { pathname, search, origin } = req.nextUrl;

  // Signed-in users have no reason to see the auth pages.
  if (AUTH_PAGES.includes(pathname)) {
    if (req.auth) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
    return;
  }

  if (!req.auth) {
    const signInUrl = new URL("/sign-in", origin);
    signInUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/items/:path*",
    "/collections/:path*",
    "/favorites",
    "/profile",
    "/settings",
    "/upgrade",
    "/sign-in",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
