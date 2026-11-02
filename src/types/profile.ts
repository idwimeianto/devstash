import type { FieldErrors } from "@/types/auth";

export interface UserProfile {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  // Email/password users can change their password; GitHub-only users have none.
  hasPassword: boolean;
}

export interface ChangePasswordState {
  success: boolean;
  data?: { message: string };
  error?: string;
  fieldErrors?: FieldErrors<"currentPassword" | "password" | "confirmPassword">;
}

export interface DeleteAccountState {
  success: boolean;
  error?: string;
}
