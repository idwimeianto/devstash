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

export interface LanguageOption {
  value: string;
  label: string;
}

// The language dropdown. Values are what gets stored, and getMonacoLanguage() resolves each one.
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: PLAIN_TEXT_LANGUAGE, label: "Plain text" },
  { value: "bash", label: "Bash" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "dart", label: "Dart" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "go", label: "Go" },
  { value: "graphql", label: "GraphQL" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "lua", label: "Lua" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "powershell", label: "PowerShell" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "hcl", label: "Terraform (HCL)" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

// The form's language text as the dropdown's value; no language means Plain text.
export function getLanguageSelectValue(language: string): string {
  return language.trim().toLowerCase() || PLAIN_TEXT_LANGUAGE;
}

// The dropdown's choice as the form's language text; Plain text is stored as no language.
export function getLanguageFromSelectValue(value: string): string {
  return value === PLAIN_TEXT_LANGUAGE ? "" : value;
}

// A language saved before the dropdown (e.g. "ts") stays listed, so saving doesn't lose it.
export function getLanguageOptions(language: string): LanguageOption[] {
  const value = getLanguageSelectValue(language);
  if (LANGUAGE_OPTIONS.some((option) => option.value === value)) return LANGUAGE_OPTIONS;
  return [{ value, label: language.trim() }, ...LANGUAGE_OPTIONS];
}
