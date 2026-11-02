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
