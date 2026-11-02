"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { registerSchema } from "@/lib/validations/auth";
import type { FieldErrors, RegisterInput, RegisterResponse } from "@/types/auth";

export function RegisterForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof RegisterInput>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: RegisterResponse = await response.json();

      if (!result.success) {
        setError(result.error ?? "Registration failed. Please try again.");
        return;
      }
      router.push(
        `/verify-email?${new URLSearchParams({ status: "sent", email: parsed.data.email })}`,
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <FormField
          name="name"
          label="Name"
          autoComplete="name"
          errors={fieldErrors.name}
          required
        />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          errors={fieldErrors.email}
          required
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          errors={fieldErrors.password}
          required
        />
        <FormField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          errors={fieldErrors.confirmPassword}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
