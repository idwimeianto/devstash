export const PLAIN_TEXT_LANGUAGE = "plaintext";

// Common names people type for a language, mapped to Monaco's language ids.
export const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  // No JSON highlighter is bundled (it comes with Monaco's JSON language service); JS colors it well.
  json: "javascript",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  console: "shell",
  terminal: "shell",
  ps: "powershell",
  ps1: "powershell",
  pwsh: "powershell",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  kt: "kotlin",
  cs: "csharp",
  "c#": "csharp",
  c: "cpp",
  "c++": "cpp",
  yml: "yaml",
  md: "markdown",
  docker: "dockerfile",
  postgres: "pgsql",
  postgresql: "pgsql",
  text: PLAIN_TEXT_LANGUAGE,
  txt: PLAIN_TEXT_LANGUAGE,
};

// The item's free-text language as a Monaco language id; Monaco shows unknown ids as plain text.
export function getMonacoLanguage(language: string | null | undefined): string {
  const name = language?.trim().toLowerCase();
  if (!name) return PLAIN_TEXT_LANGUAGE;
  return LANGUAGE_ALIASES[name] ?? name;
}
