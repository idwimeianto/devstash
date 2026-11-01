import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in · DevStash",
};

export default function SignInPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back to your developer stash.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* The form reads the URL's search params, which aren't known at build time. */}
        <Suspense>
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
