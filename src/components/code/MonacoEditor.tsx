"use client";

// Browser only: Monaco touches `window` as soon as it loads, so CodeEditor imports this
// module with next/dynamic and ssr: false.
import Editor, { loader, type BeforeMount, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor";
// Syntax highlighting for every basic language; each one loads on first use.
import "monaco-editor/basic-languages/monaco.contribution";
import { useEffect, useMemo, useState } from "react";

import { MONACO_THEMES } from "@/components/code/editor-themes";
import { getEditorLineHeight } from "@/lib/editor-preferences";
import type { EditorPreferences } from "@/types/editor-preferences";

// The bundled copy of Monaco instead of the wrapper's default CDN download.
self.MonacoEnvironment = {
  getWorker: () =>
    new Worker(new URL("./editor.worker.ts", import.meta.url), { type: "module" }),
};
loader.config({ monaco });

const MAX_HEIGHT = 400;
// Room to type in when the editor starts empty.
const MIN_EDITABLE_HEIGHT = 120;

export const VERTICAL_PADDING = 12;

const BASE_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  scrollBeyondLastLine: false,
  // The tab size preference wins over guessing it from the content.
  detectIndentation: false,
  padding: { top: VERTICAL_PADDING, bottom: VERTICAL_PADDING },
  lineNumbersMinChars: 3,
  folding: false,
  glyphMargin: false,
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  stickyScroll: { enabled: false },
  scrollbar: {
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    useShadows: false,
    // Lets the drawer or dialog scroll once the editor reaches its end.
    alwaysConsumeMouseWheel: false,
  },
};

const defineThemes: BeforeMount = (instance) => {
  for (const { id, data } of Object.values(MONACO_THEMES)) {
    instance.editor.defineTheme(id, data);
  }
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
  preferences: EditorPreferences;
  onChange?: (value: string) => void;
  onReady: () => void;
}

export default function MonacoEditor({
  value,
  language,
  readOnly,
  ariaLabel,
  preferences,
  onChange,
  onReady,
}: MonacoEditorProps) {
  const { fontSize, tabSize, wordWrap, minimap, theme } = preferences;
  const minHeight = readOnly ? 0 : MIN_EDITABLE_HEIGHT;
  const [height, setHeight] = useState(minHeight);
  const [model, setModel] = useState<monaco.editor.ITextModel | null>(null);
  // Stable between height changes, so the wrapper doesn't re-apply options or re-read styles.
  const options = useMemo(
    () => ({
      ...BASE_OPTIONS,
      fontFamily: getMonoFontFamily(),
      fontSize,
      lineHeight: getEditorLineHeight(fontSize),
      wordWrap: wordWrap ? ("on" as const) : ("off" as const),
      minimap: { enabled: minimap },
      ariaLabel,
      readOnly,
      domReadOnly: readOnly,
      renderLineHighlight: readOnly ? ("none" as const) : ("line" as const),
    }),
    [ariaLabel, readOnly, fontSize, wordWrap, minimap],
  );

  // Tab size belongs to the text model, not the editor options.
  useEffect(() => {
    model?.updateOptions({ tabSize, indentSize: tabSize });
  }, [model, tabSize]);

  // Grows with the content up to MAX_HEIGHT, then scrolls.
  const handleMount: OnMount = (editor) => {
    const fit = () =>
      setHeight(Math.min(Math.max(editor.getContentHeight(), minHeight), MAX_HEIGHT));
    editor.onDidContentSizeChange(fit);
    fit();
    setModel(editor.getModel());
    onReady();
  };

  return (
    <Editor
      // Editable editors are uncontrolled: pushing each keystroke's state back as `value` races
      // fast typing and drops characters. The forms mount a fresh editor for every item anyway.
      {...(readOnly ? { value } : { defaultValue: value })}
      language={language}
      theme={MONACO_THEMES[theme].id}
      height={height}
      loading={null}
      beforeMount={defineThemes}
      onMount={handleMount}
      onChange={(next) => onChange?.(next ?? "")}
      options={options}
    />
  );
}
