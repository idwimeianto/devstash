import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { LANGUAGE_ALIASES, PLAIN_TEXT_LANGUAGE, getMonacoLanguage } from "@/lib/code-language";

describe("LANGUAGE_ALIASES", () => {
  it("only maps to languages the installed Monaco ships a highlighter for", () => {
    // The entry MonacoEditor imports lives in esm/vs, next to the language definitions.
    const monacoEsm = dirname(createRequire(import.meta.url).resolve("monaco-editor/editor"));
    const shipped = new Set(
      readdirSync(join(monacoEsm, "languages/definitions"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name),
    );

    const unknown = Object.values(LANGUAGE_ALIASES).filter(
      (id) => id !== PLAIN_TEXT_LANGUAGE && !shipped.has(id),
    );
    expect(unknown).toEqual([]);
  });
});

describe("getMonacoLanguage", () => {
  it("passes Monaco language ids through", () => {
    expect(getMonacoLanguage("typescript")).toBe("typescript");
    expect(getMonacoLanguage("dockerfile")).toBe("dockerfile");
    expect(getMonacoLanguage("python")).toBe("python");
  });

  it("maps common aliases to Monaco ids", () => {
    expect(getMonacoLanguage("ts")).toBe("typescript");
    expect(getMonacoLanguage("bash")).toBe("shell");
    expect(getMonacoLanguage("sh")).toBe("shell");
    expect(getMonacoLanguage("yml")).toBe("yaml");
    expect(getMonacoLanguage("c++")).toBe("cpp");
    expect(getMonacoLanguage("json")).toBe("javascript");
  });

  it("ignores case and surrounding spaces", () => {
    expect(getMonacoLanguage("  TypeScript ")).toBe("typescript");
    expect(getMonacoLanguage("BASH")).toBe("shell");
  });

  it("falls back to plain text when there's no language", () => {
    expect(getMonacoLanguage(null)).toBe("plaintext");
    expect(getMonacoLanguage(undefined)).toBe("plaintext");
    expect(getMonacoLanguage("   ")).toBe("plaintext");
    expect(getMonacoLanguage("txt")).toBe("plaintext");
  });

  it("passes unknown names through, which Monaco shows as plain text", () => {
    expect(getMonacoLanguage("cobol")).toBe("cobol");
  });
});
