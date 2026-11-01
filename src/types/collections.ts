export interface CollectionTypeSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  // Types in the collection, most-used first.
  types: CollectionTypeSummary[];
  // Most-used type, falling back to the collection's default type when empty.
  mainTypeName: string | null;
}

export interface CollectionStats {
  collections: number;
  favoriteCollections: number;
}
