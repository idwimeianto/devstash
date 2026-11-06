import { useId, type ReactNode } from "react";

interface EditorFieldProps {
  label: string;
  error?: string;
  // Receives the error text's id while there is an error, for aria-describedby.
  children: (errorId: string | undefined) => ReactNode;
}

// The editors' counterpart of TextareaField: label above, error text below.
export function EditorField({ label, error, children }: EditorFieldProps) {
  const errorId = `${useId()}-error`;

  return (
    <div className="grid gap-2">
      {/* The editor takes its label through ariaLabel, so this one is visual only. */}
      <span className="text-sm leading-none font-medium select-none">{label}</span>
      {children(error ? errorId : undefined)}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
