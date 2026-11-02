import { useId, type ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends ComponentProps<typeof Textarea> {
  label: string;
  errors?: string[];
}

// Textarea counterpart of FormField: label, error text and aria wiring.
export function TextareaField({ label, errors, className, ...textareaProps }: TextareaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const error = errors?.[0];

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn("resize-y", className)}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
