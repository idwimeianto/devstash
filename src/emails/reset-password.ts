import { renderEmailLayout, type EmailContent } from "@/emails/layout";

export function renderResetPasswordEmail(resetUrl: string): EmailContent {
  const subject = "Reset your DevStash password";

  const text = `Reset your DevStash password

We received a request to reset the password for your account. Choose a new one here:
${resetUrl}

This link expires in 1 hour and can only be used once. If you didn't ask to reset your password, you can ignore this email.`;

  const html = renderEmailLayout({
    subject,
    preheader: "Choose a new password for your DevStash account.",
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your DevStash account. Click the button below to choose a new one.",
    buttonLabel: "Reset my password",
    url: resetUrl,
    footer:
      "This link expires in 1 hour and can only be used once. If you didn't ask to reset your password, you can ignore this email.",
  });

  return { subject, html, text };
}
