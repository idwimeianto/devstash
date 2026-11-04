import type { editor } from "monaco-editor/editor";

import type { EditorTheme } from "@/lib/editor-preferences";

// Transparent background so the CodeEditor frame shows through; slim scrollbars in the app's grays.
const FRAME_COLORS: editor.IColors = {
  "editor.background": "#00000000",
  "editorGutter.background": "#00000000",
  "minimap.background": "#00000000",
  "editor.lineHighlightBackground": "#ffffff0a",
  "editor.lineHighlightBorder": "#00000000",
  "editorLineNumber.foreground": "#525252",
  "editorLineNumber.activeForeground": "#a3a3a3",
  "focusBorder": "#00000000",
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#ffffff1f",
  "scrollbarSlider.hoverBackground": "#ffffff33",
  "scrollbarSlider.activeBackground": "#ffffff4d",
};

// Monaco's token names from its Monarch highlighters.
const MONOKAI: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "f8f8f2" },
    { token: "comment", foreground: "75715e", fontStyle: "italic" },
    { token: "string", foreground: "e6db74" },
    { token: "regexp", foreground: "e6db74" },
    { token: "keyword", foreground: "f92672" },
    { token: "number", foreground: "ae81ff" },
    { token: "constant", foreground: "ae81ff" },
    { token: "type", foreground: "66d9ef", fontStyle: "italic" },
    { token: "predefined", foreground: "66d9ef" },
    { token: "function", foreground: "a6e22e" },
    { token: "tag", foreground: "f92672" },
    { token: "attribute.name", foreground: "a6e22e" },
    { token: "attribute.value", foreground: "e6db74" },
    { token: "variable", foreground: "f8f8f2" },
    { token: "delimiter", foreground: "f8f8f2" },
  ],
  colors: {
    "editor.foreground": "#f8f8f2",
    "editorCursor.foreground": "#f8f8f0",
    "editor.selectionBackground": "#49483e",
    ...FRAME_COLORS,
  },
};

const GITHUB_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "e6edf3" },
    { token: "comment", foreground: "8b949e" },
    { token: "string", foreground: "a5d6ff" },
    { token: "regexp", foreground: "7ee787" },
    { token: "keyword", foreground: "ff7b72" },
    { token: "number", foreground: "79c0ff" },
    { token: "constant", foreground: "79c0ff" },
    { token: "type", foreground: "ffa657" },
    { token: "predefined", foreground: "d2a8ff" },
    { token: "function", foreground: "d2a8ff" },
    { token: "tag", foreground: "7ee787" },
    { token: "attribute.name", foreground: "79c0ff" },
    { token: "attribute.value", foreground: "a5d6ff" },
    { token: "variable", foreground: "ffa657" },
    { token: "delimiter", foreground: "e6edf3" },
  ],
  colors: {
    "editor.foreground": "#e6edf3",
    "editorCursor.foreground": "#e6edf3",
    "editor.selectionBackground": "#3392ff44",
    ...FRAME_COLORS,
  },
};

// "vs-dark" keeps Monaco's own colors with the app's frame tweaks.
const VS_DARK: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: FRAME_COLORS,
};

export const MONACO_THEMES: Record<EditorTheme, { id: string; data: editor.IStandaloneThemeData }> =
  {
    "vs-dark": { id: "devstash-dark", data: VS_DARK },
    monokai: { id: "devstash-monokai", data: MONOKAI },
    "github-dark": { id: "devstash-github-dark", data: GITHUB_DARK },
  };
