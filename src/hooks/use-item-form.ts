import { useCallback, useState } from "react";

import type { ItemFormValues } from "@/lib/item-fields";
import type { CreateItemInput } from "@/types/items";

export type ItemFieldErrors = Partial<Record<keyof CreateItemInput, string[]>>;

const EMPTY_VALUES: ItemFormValues = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

// The item forms' field values and the server's field errors.
export function useItemForm(initial: Partial<ItemFormValues> = {}) {
  const [values, setValues] = useState<ItemFormValues>(() => ({ ...EMPTY_VALUES, ...initial }));
  const [fieldErrors, setFieldErrors] = useState<ItemFieldErrors>({});

  const setField = useCallback((name: keyof ItemFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
  }, []);

  return { values, setField, fieldErrors, setFieldErrors };
}
