export interface ItemSummary {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  typeName: string;
  tags: string[];
  // Last used, falling back to created.
  date: Date;
}

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
