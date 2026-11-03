import { z } from "zod";

// The failed result of an action whose input didn't pass its Zod schema: the first issue as
// the message (for the toast) and every field's errors (shown inline).
export function validationFailure<T>(error: z.ZodError<T>) {
  return {
    success: false as const,
    error: error.issues[0]?.message ?? "Invalid input",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}
