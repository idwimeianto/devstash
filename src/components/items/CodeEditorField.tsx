import { CodeEditor } from "@/components/code/CodeEditor";

interface CodeEditorFieldProps {
  label: string;
  value: string;
  language: string;
  onChange: (value: string) => void;
  errors?: string[];
}

// CodeEditor counterpart of TextareaField: label above, error text below.
export function CodeEditorField({ label, value, language, onChange, errors }: CodeEditorFieldProps) {
  const error = errors?.[0];

  return (
    <div className="grid gap-2">
      {/* Monaco's own textarea takes the label through ariaLabel, so this one is visual only. */}
      <span className="text-sm leading-none font-medium select-none">{label}</span>
      <CodeEditor
        value={value}
        language={language}
        ariaLabel={label}
        onChange={onChange}
        invalid={Boolean(error)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
