export interface EditableItemFields {
  content: boolean;
  language: boolean;
  url: boolean;
}

// Types the New Item dialog offers; File and Image need uploads and come later.
export const CREATABLE_ITEM_TYPES = ["snippet", "prompt", "command", "note", "link"] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

// The item's content kind: links store a URL, the other creatable types text.
export function getItemContentType(typeName: CreatableItemType): "TEXT" | "URL" {
  return URL_TYPES.has(typeName) ? "URL" : "TEXT";
}

// Snippets and commands hold code, so their content gets the code editor.
export function isCodeItemType(typeName: string): boolean {
  return LANGUAGE_TYPES.has(typeName);
}

// Which type-specific fields an item of this type can edit; title, description and tags always can.
export function getEditableItemFields(typeName: string): EditableItemFields {
  return {
    content: CONTENT_TYPES.has(typeName),
    language: LANGUAGE_TYPES.has(typeName),
    url: URL_TYPES.has(typeName),
  };
}

// "react, hooks, react" -> ["react", "hooks"]
export function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}
