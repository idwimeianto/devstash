import { z } from "zod";

// Error code for email/password sign-in by a user who hasn't verified their email.
export const EMAIL_NOT_VERIFIED = "email_not_verified";

// Error code for email/password sign-in blocked by the login rate limit.
export const SIGN_IN_RATE_LIMITED = "rate_limited";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

// bcrypt ignores everything after 72 bytes, so the limit counts bytes, not characters.
const MAX_PASSWORD_BYTES = 72;

const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES,
    "Password is too long (at most 72 characters, fewer with emoji or accented letters)",
  );

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  params: { message: "Passwords do not match", path: ["confirmPassword"] },
};

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const forgotPasswordSchema = z.object({ email });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is missing"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);
