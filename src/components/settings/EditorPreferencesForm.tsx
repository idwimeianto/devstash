"use client";

import { useId, useRef, type ReactNode } from "react";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { useEditorPreferences } from "@/components/code/EditorPreferencesProvider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEME_LABELS,
  EDITOR_THEMES,
} from "@/lib/editor-preferences";
import { runItemAction } from "@/lib/run-item-action";
import type { EditorPreferences } from "@/types/editor-preferences";

const FONT_SIZE_ITEMS = EDITOR_FONT_SIZES.map((size) => ({ value: size, label: `${size}px` }));
const TAB_SIZE_ITEMS = EDITOR_TAB_SIZES.map((size) => ({ value: size, label: `${size} spaces` }));
const THEME_ITEMS = EDITOR_THEMES.map((theme) => ({
  value: theme,
  label: EDITOR_THEME_LABELS[theme],
}));

// Saves each change as soon as it's made; there's no save button.
export function EditorPreferencesForm() {
  const { preferences, setPreferences } = useEditorPreferences();
  // What the server last accepted, to roll back to when a save fails.
  const saved = useRef(preferences);

  const save = async <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    const result = await runItemAction(() => updateEditorPreferences(next), {
      successMessage: "Editor preferences saved",
      onFieldErrors: () => {},
    });
    if (result) {
      saved.current = result;
    } else {
      setPreferences(saved.current);
    }
  };

  return (
    <div className="grid gap-5">
      <PreferenceRow label="Font size" description="Text size in the code editor.">
        {(id) => (
          <Select
            items={FONT_SIZE_ITEMS}
            value={preferences.fontSize}
            onValueChange={(value) => value !== null && save("fontSize", value)}
          >
            <SelectTrigger id={id} className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PreferenceRow>

      <PreferenceRow label="Tab size" description="Spaces per indentation level.">
        {(id) => (
          <Select
            items={TAB_SIZE_ITEMS}
            value={preferences.tabSize}
            onValueChange={(value) => value !== null && save("tabSize", value)}
          >
            <SelectTrigger id={id} className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PreferenceRow>

      <PreferenceRow label="Theme" description="Syntax highlighting colors.">
        {(id) => (
          <Select
            items={THEME_ITEMS}
            value={preferences.theme}
            onValueChange={(value) => value !== null && save("theme", value)}
          >
            <SelectTrigger id={id} className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEME_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PreferenceRow>

      <PreferenceRow label="Word wrap" description="Wrap long lines instead of scrolling sideways.">
        {(id) => (
          <Switch
            id={id}
            checked={preferences.wordWrap}
            onCheckedChange={(checked) => save("wordWrap", checked)}
          />
        )}
      </PreferenceRow>

      <PreferenceRow label="Minimap" description="Show a code overview beside the editor.">
        {(id) => (
          <Switch
            id={id}
            checked={preferences.minimap}
            onCheckedChange={(checked) => save("minimap", checked)}
          />
        )}
      </PreferenceRow>
    </div>
  );
}

interface PreferenceRowProps {
  label: string;
  description: string;
  // Receives the id to put on the control, so the label points at it.
  children: (id: string) => ReactNode;
}

function PreferenceRow({ label, description, children }: PreferenceRowProps) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children(id)}
    </div>
  );
}
