"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionOptions } from "@/hooks/use-collection-options";
import type { CollectionOption } from "@/types/collections";

interface CollectionPickerProps {
  value: string[];
  onChange: (collectionIds: string[]) => void;
  errors?: string[];
}

// The item forms' Collections field: selected collections as removable chips in an input
// that filters the user's collections as you type.
export function CollectionPicker({ value, onChange, errors }: CollectionPickerProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const error = errors?.[0];
  const anchor = useComboboxAnchor();
  const { state, retry } = useCollectionOptions();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Collections</Label>
      {state.status === "loading" && <Skeleton aria-busy="true" className="h-8 w-full rounded-lg" />}
      {state.status === "error" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{state.error}</span>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      {state.status === "ready" && state.options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No collections yet. Create one with New Collection.
        </p>
      )}
      {state.status === "ready" && state.options.length > 0 && (
        <Combobox
          items={state.options}
          multiple
          value={state.options.filter((option) => value.includes(option.id))}
          onValueChange={(selected) => onChange(selected.map((option) => option.id))}
          itemToStringLabel={(option) => option.name}
          isItemEqualToValue={(option, selected) => option.id === selected.id}
        >
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(selected: CollectionOption[]) => (
                <>
                  {selected.map((option) => (
                    <ComboboxChip
                      key={option.id}
                      className="max-w-full"
                      removeLabel={`Remove ${option.name}`}
                    >
                      <span className="truncate">{option.name}</span>
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    id={id}
                    placeholder={selected.length ? "" : "Add to collections…"}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No matching collections.</ComboboxEmpty>
            <ComboboxList>
              {(option: CollectionOption) => (
                <ComboboxItem key={option.id} value={option}>
                  <span className="truncate">{option.name}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
