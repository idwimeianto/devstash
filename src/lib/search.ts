export const PREVIEW_LENGTH = 120;

// First non-empty text, whitespace collapsed to single spaces and cut to PREVIEW_LENGTH.
export function toContentPreview(...texts: (string | null | undefined)[]): string | null {
  for (const text of texts) {
    const line = text?.replace(/\s+/g, " ").trim();
    if (!line) continue;
    return line.length > PREVIEW_LENGTH ? `${line.slice(0, PREVIEW_LENGTH - 1)}…` : line;
  }
  return null;
}
