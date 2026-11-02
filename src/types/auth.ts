import type { z } from "zod";

import type { registerSchema } from "@/lib/validations/auth";

export type FieldErrors<T extends string> = Partial<Record<T, string[]>>;

export interface SignInState {
  success: boolean;
  error?: string;
  email?: string;
  fieldErrors?: FieldErrors<"email" | "password">;
}

export type RegisterInput = z.infer<typeof registerSchema>;

export interface RegisterResponse {
  success: boolean;
  data?: {
    id: string;
    name: string | null;
    email: string;
    verificationRequired: boolean;
  };
  error?: string;
}

export interface SessionUser {
  name: string | null;
  email: string | null;
  image: string | null;
}
