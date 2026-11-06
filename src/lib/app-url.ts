const DEV_APP_URL = "http://localhost:3000";

// Base URL for links in emails. Configured rather than read from the request's Host header,
// which a client can spoof to point verification links at another site.
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return DEV_APP_URL;
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}
