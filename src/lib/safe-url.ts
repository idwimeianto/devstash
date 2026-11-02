const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

// Stored URLs are user input, so only http(s) ones become links; a "javascript:" URL can't run.
export function getSafeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}
