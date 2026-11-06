import { Resend } from "resend";

import type { EmailContent } from "@/emails/layout";
import { renderResetPasswordEmail } from "@/emails/reset-password";
import { renderVerifyEmail } from "@/emails/verify-email";

// Used when RESEND_FROM is missing or empty. Resend's shared sender only delivers to the Resend
// account owner, so production must set RESEND_FROM to an address on a verified domain.
const DEFAULT_FROM = "DevStash <onboarding@resend.dev>";

let resend: Resend | undefined;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

async function sendEmail(to: string, content: EmailContent, kind: string) {
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM || DEFAULT_FROM,
    to,
    ...content,
  });

  if (error) {
    throw new Error(`Failed to send ${kind} email: ${error.message}`);
  }
}

export function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendEmail(to, renderVerifyEmail(verifyUrl), "verification");
}

export function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail(to, renderResetPasswordEmail(resetUrl), "password reset");
}
