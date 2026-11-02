import { renderEmailLayout, type EmailContent } from "@/emails/layout";

export function renderVerifyEmail(verifyUrl: string): EmailContent {
  const subject = "Verify your DevStash email";

  const text = `Welcome to DevStash!

Confirm your email address to finish creating your account:
${verifyUrl}

This link expires in 24 hours. If you didn't sign up, you can ignore this email.`;

  const html = renderEmailLayout({
    subject,
    preheader: "Confirm your email to finish creating your DevStash account.",
    heading: "Verify your email",
    intro: "Welcome to DevStash! Confirm your email address to finish creating your account.",
    buttonLabel: "Verify my email",
    url: verifyUrl,
    footer:
      "This link expires in 24 hours. If you didn't sign up for DevStash, you can ignore this email.",
  });

  return { subject, html, text };
}
