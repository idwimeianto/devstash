import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LANGUAGE_ALIASES,
  LANGUAGE_OPTIONS,
  PLAIN_TEXT_LANGUAGE,
  getLanguageFromSelectValue,
  getLanguageOptions,
  getLanguageSelectValue,
  getMonacoLanguage,
} from "@/lib/code-language";

// The entry MonacoEditor imports lives in esm/vs, next to the language definitions.
function getShippedLanguages() {
  const monacoEsm = dirname(createRequire(import.meta.url).resolve("monaco-editor/editor"));
  return new Set(
    readdirSync(join(monacoEsm, "languages/definitions"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );
}

describe("LANGUAGE_ALIASES", () => {
  it("only maps to languages the installed Monaco ships a highlighter for", () => {
    const shipped = getShippedLanguages();
    const unknown = Object.values(LANGUAGE_ALIASES).filter(
      (id) => id !== PLAIN_TEXT_LANGUAGE && !shipped.has(id),
    );
    expect(unknown).toEqual([]);
  });
});

describe("LANGUAGE_OPTIONS", () => {
  it("only lists languages the installed Monaco ships a highlighter for", () => {
    const shipped = getShippedLanguages();
    const unknown = LANGUAGE_OPTIONS.map((option) => getMonacoLanguage(option.value)).filter(
      (id) => id !== PLAIN_TEXT_LANGUAGE && !shipped.has(id),
    );
    expect(unknown).toEqual([]);
  });
});

describe("getLanguageSelectValue", () => {
  it("selects Plain text when there's no language", () => {
    expect(getLanguageSelectValue("")).toBe(PLAIN_TEXT_LANGUAGE);
    expect(getLanguageSelectValue("  ")).toBe(PLAIN_TEXT_LANGUAGE);
  });

  it("ignores case and surrounding spaces", () => {
    expect(getLanguageSelectValue(" TypeScript ")).toBe("typescript");
  });
});

describe("getLanguageFromSelectValue", () => {
  it("stores Plain text as no language and anything else as is", () => {
    expect(getLanguageFromSelectValue(PLAIN_TEXT_LANGUAGE)).toBe("");
    expect(getLanguageFromSelectValue("python")).toBe("python");
  });
});

describe("getLanguageOptions", () => {
  it("returns the standard list for no language or a listed one", () => {
    expect(getLanguageOptions("")).toBe(LANGUAGE_OPTIONS);
    expect(getLanguageOptions("bash")).toBe(LANGUAGE_OPTIONS);
    expect(getLanguageOptions("TypeScript")).toBe(LANGUAGE_OPTIONS);
  });

  it("keeps a language that isn't listed as an extra first option", () => {
    const options = getLanguageOptions(" Zig ");
    expect(options[0]).toEqual({ value: "zig", label: "Zig" });
    expect(options).toHaveLength(LANGUAGE_OPTIONS.length + 1);
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
