import type { UploadedFile } from "@/types/uploads";

export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  typeName: string;
  tags: string[];
  // What the card's copy button copies: the URL for links, else the content; null when empty.
  copyValue: string | null;
  // Public R2 URL for file types, used for image thumbnails.
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  // Last used, falling back to created.
  date: Date;
  // When the item (and its upload) was created.
  createdAt: Date;
}

// A row on the favorites page.
export interface FavoriteItem {
  id: string;
  title: string;
  typeName: string;
  // Stands in for when it was favorited, since there's no separate timestamp.
  updatedAt: Date;
}

// The sections of a collection page, each paginated on its own.
export type CollectionSection = "items" | "files" | "images";

export interface ItemCollectionRef {
  id: string;
  name: string;
}

// Everything the item drawer shows, including content, which cards don't load.
export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "URL" | "FILE";
  content: string | null;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  isPinned: boolean;
  isFavorite: boolean;
  typeName: string;
  tags: string[];
  collections: ItemCollectionRef[];
  createdAt: Date;
  updatedAt: Date;
}

// ItemDetail as sent by GET /api/items/[id]: dates become ISO strings in JSON.
export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type ItemDetailResponse =
  | { success: true; data: ItemDetailJson }
  | { success: false; error: string };

// Payload the drawer's edit form sends; only the fields for the item's type are included.
export interface UpdateItemInput {
  title: string;
  description: string | null;
  tags: string[];
  content?: string | null;
  language?: string | null;
  url?: string | null;
  // Every collection the item should be in; left out, its collections stay as they are.
  collectionIds?: string[];
}

export type UpdateItemResult =
  | { success: true; data: ItemDetailJson }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof UpdateItemInput, string[]>> };

// Payload the New Item dialog sends; the type picks which optional fields are included.
export interface CreateItemInput extends UpdateItemInput {
  typeName: string;
  // File and image items: the upload from POST /api/upload; its size is read from R2.
  file?: Omit<UploadedFile, "fileSize">;
}

export type CreateItemResult =
  | { success: true; data: ItemDetailJson }
  | { success: false; error: string; fieldErrors?: Partial<Record<keyof CreateItemInput, string[]>> };

export type DeleteItemResult = { success: true } | { success: false; error: string };

export interface ItemTypeRef {
  id: string;
  name: string;
}

export interface ItemTypeWithCount {
  id: string;
  name: string;
  itemCount: number;
}

export interface ItemStats {
  items: number;
  favoriteItems: number;
}
