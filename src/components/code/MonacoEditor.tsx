"use client";

// Browser only: Monaco touches `window` as soon as it loads, so CodeEditor imports this
// module with next/dynamic and ssr: false.
import Editor, { loader, type BeforeMount, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor";
// Syntax highlighting for every basic language; each one loads on first use.
import "monaco-editor/basic-languages/monaco.contribution";
import { useState } from "react";

// The bundled copy of Monaco instead of the wrapper's default CDN download.
self.MonacoEnvironment = {
  getWorker: () =>
    new Worker(new URL("./editor.worker.ts", import.meta.url), { type: "module" }),
};
loader.config({ monaco });

const THEME = "devstash-dark";
const MAX_HEIGHT = 400;
// Room to type in when the editor starts empty.
const MIN_EDITABLE_HEIGHT = 120;

export const LINE_HEIGHT = 18;
export const VERTICAL_PADDING = 12;

const BASE_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 12,
  lineHeight: LINE_HEIGHT,
  padding: { top: VERTICAL_PADDING, bottom: VERTICAL_PADDING },
  lineNumbersMinChars: 3,
  folding: false,
  glyphMargin: false,
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  stickyScroll: { enabled: false },
  tabSize: 2,
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    useShadows: false,
    // Lets the drawer or dialog scroll once the editor reaches its end.
    alwaysConsumeMouseWheel: false,
  },
};

// Transparent background so the CodeEditor frame shows through; slim scrollbars in the app's grays.
const defineTheme: BeforeMount = (instance) => {
  instance.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editor.lineHighlightBorder": "#00000000",
      "editorLineNumber.foreground": "#525252",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "focusBorder": "#00000000",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });
};

// Geist Mono from next/font; Monaco measures text itself, so it needs the real family names.
function getMonoFontFamily(): string {
  const geistMono = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
  return [geistMono, "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
    .filter(Boolean)
    .join(", ");
}

export interface MonacoEditorProps {
  value: string;
  language: string;
  readOnly: boolean;
  ariaLabel: string;
  onChange?: (value: string) => void;
  onReady: () => void;
}

export default function MonacoEditor({
  value,
  language,
  readOnly,
  ariaLabel,
  onChange,
  onReady,
}: MonacoEditorProps) {
  const minHeight = readOnly ? 0 : MIN_EDITABLE_HEIGHT;
  const [height, setHeight] = useState(minHeight);

  // Grows with the content up to MAX_HEIGHT, then scrolls.
  const handleMount: OnMount = (editor) => {
    const fit = () =>
      setHeight(Math.min(Math.max(editor.getContentHeight(), minHeight), MAX_HEIGHT));
    editor.onDidContentSizeChange(fit);
    fit();
    onReady();
  };

  return (
    <Editor
      // Editable editors are uncontrolled: pushing each keystroke's state back as `value` races
      // fast typing and drops characters. The forms mount a fresh editor for every item anyway.
      {...(readOnly ? { value } : { defaultValue: value })}
      language={language}
      theme={THEME}
      height={height}
      loading={null}
      beforeMount={defineTheme}
      onMount={handleMount}
      onChange={(next) => onChange?.(next ?? "")}
      options={{
        ...BASE_OPTIONS,
        fontFamily: getMonoFontFamily(),
        ariaLabel,
        readOnly,
        domReadOnly: readOnly,
        renderLineHighlight: readOnly ? "none" : "line",
      }}
    />
  );
}
