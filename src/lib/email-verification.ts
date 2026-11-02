// On unless explicitly turned off, so a missing variable can't disable verification in production.
export function isEmailVerificationEnabled(): boolean {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}
