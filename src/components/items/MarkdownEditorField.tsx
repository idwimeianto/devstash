import { EditorField } from "@/components/items/EditorField";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor";

interface MarkdownEditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
}

export function MarkdownEditorField({ label, value, onChange, errors }: MarkdownEditorFieldProps) {
  const error = errors?.[0];

  return (
    <EditorField label={label} error={error}>
      {(errorId) => (
        <MarkdownEditor
          value={value}
          ariaLabel={label}
          onChange={onChange}
          invalid={Boolean(error)}
          describedBy={errorId}
        />
      )}
    </EditorField>
  );
}
