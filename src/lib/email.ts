import { Resend } from "resend";

import { renderVerifyEmail } from "@/emails/verify-email";

// Resend's shared sender; it only delivers to the Resend account owner until a domain is verified.
const DEFAULT_FROM = "DevStash <onboarding@resend.dev>";

let resend: Resend | undefined;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM ?? DEFAULT_FROM,
    to,
    ...renderVerifyEmail(verifyUrl),
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
