// Verification email content. Email clients ignore stylesheets and most strip SVG,
// so styles are inline, layout uses tables, and colors are hex equivalents of the
// app's dark theme tokens in `globals.css`.

const COLORS = {
  background: "#0a0a0a", // --background
  card: "#171717", // --card
  border: "#262626", // --border on the card
  foreground: "#fafafa", // --foreground
  mutedForeground: "#a3a3a3", // --muted-foreground
  primary: "#e5e5e5", // --primary (button background)
  primaryForeground: "#171717", // --primary-foreground
  logoFrom: "#8b5cf6", // violet-500, as in the top bar logo
  logoTo: "#4f46e5", // indigo-600
};

const FONT_STACK =
  "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

interface VerifyEmailContent {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderVerifyEmail(verifyUrl: string): VerifyEmailContent {
  const url = escapeHtml(verifyUrl);
  const subject = "Verify your DevStash email";

  const text = `Welcome to DevStash!

Confirm your email address to finish creating your account:
${verifyUrl}

This link expires in 24 hours. If you didn't sign up, you can ignore this email.`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};">
<div style="display:none;max-height:0;overflow:hidden;">Confirm your email to finish creating your DevStash account.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.background};">
<tr>
<td align="center" style="padding:48px 16px;font-family:${FONT_STACK};">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr>
<td width="32" height="32" align="center" valign="middle" style="width:32px;height:32px;border-radius:8px;background-color:${COLORS.logoTo};background-image:linear-gradient(135deg,${COLORS.logoFrom},${COLORS.logoTo});color:#ffffff;font-size:16px;font-weight:700;line-height:32px;">D</td>
<td style="padding-left:8px;color:${COLORS.foreground};font-size:18px;font-weight:600;">DevStash</td>
</tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:400px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:12px;">
<tr>
<td style="padding:32px 24px;">
<h1 style="margin:0 0 8px;color:${COLORS.foreground};font-size:20px;font-weight:600;line-height:1.3;">Verify your email</h1>
<p style="margin:0 0 24px;color:${COLORS.mutedForeground};font-size:14px;line-height:1.6;">Welcome to DevStash! Confirm your email address to finish creating your account.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="border-radius:8px;background-color:${COLORS.primary};">
<a href="${url}" style="display:block;padding:10px 16px;color:${COLORS.primaryForeground};font-size:14px;font-weight:500;text-decoration:none;">Verify my email</a>
</td>
</tr>
</table>
<p style="margin:24px 0 0;color:${COLORS.mutedForeground};font-size:12px;line-height:1.6;">Button not working? Paste this link into your browser:<br><a href="${url}" style="color:${COLORS.foreground};word-break:break-all;">${url}</a></p>
</td>
</tr>
</table>

<p style="margin:24px 0 0;max-width:400px;color:${COLORS.mutedForeground};font-size:12px;line-height:1.6;">This link expires in 24 hours. If you didn't sign up for DevStash, you can ignore this email.</p>

</td>
</tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
