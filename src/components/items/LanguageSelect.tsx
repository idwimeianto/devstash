"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLanguageFromSelectValue,
  getLanguageOptions,
  getLanguageSelectValue,
} from "@/lib/code-language";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
}

export function LanguageSelect({ value, onChange, errors }: LanguageSelectProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const error = errors?.[0];
  const options = getLanguageOptions(value);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Language</Label>
      <Select
        items={options}
        value={getLanguageSelectValue(value)}
        onValueChange={(next) => next !== null && onChange(getLanguageFromSelectValue(next))}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        {/* Opens below the field rather than over it, since the list is long. */}
        <SelectContent alignItemWithTrigger={false} className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
