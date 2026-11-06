import { CodeEditor } from "@/components/code/CodeEditor";
import { EditorField } from "@/components/items/EditorField";

interface CodeEditorFieldProps {
  label: string;
  value: string;
  language: string;
  onChange: (value: string) => void;
  errors?: string[];
}

export function CodeEditorField({ label, value, language, onChange, errors }: CodeEditorFieldProps) {
  const error = errors?.[0];

  return (
    <EditorField label={label} error={error}>
      {() => (
        <CodeEditor
          value={value}
          language={language}
          // Monaco has no aria-describedby option, so screen readers get the error from the label.
          ariaLabel={error ? `${label}: ${error}` : label}
          onChange={onChange}
          invalid={Boolean(error)}
        />
      )}
    </EditorField>
  );
}
