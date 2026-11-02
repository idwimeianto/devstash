import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Verify email · DevStash",
};

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardContent className="py-2">
        {/* The status comes from the URL's search params, which aren't known at build time. */}
        <Suspense>
          <VerifyEmailStatus />
        </Suspense>
      </CardContent>
    </Card>
  );
}
