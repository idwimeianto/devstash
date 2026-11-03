import { useId } from "react";

import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";

interface MarkdownEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
}

// MarkdownEditor counterpart of TextareaField: label above, error text below.
export function MarkdownEditorField({ label, value, onChange, errors }: MarkdownEditorFieldProps) {
  const errorId = `${useId()}-error`;
  const error = errors?.[0];

  return (
    <div className="grid gap-2">
      {/* The editor's textarea takes the label through ariaLabel, so this one is visual only. */}
      <span className="text-sm leading-none font-medium select-none">{label}</span>
      <MarkdownEditor
        value={value}
        ariaLabel={label}
        onChange={onChange}
        invalid={Boolean(error)}
        describedBy={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
