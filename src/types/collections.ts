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

// A collection's own fields, for the collection page header.
export interface CollectionRef {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}

export interface SidebarCollection {
  id: string;
  name: string;
  itemCount: number;
  // Most-used type, falling back to the collection's default type when empty.
  mainTypeName: string | null;
}

export interface SidebarCollections {
  favorites: SidebarCollection[];
  // Newest non-favorite collections.
  recent: SidebarCollection[];
}

export interface CollectionStats {
  collections: number;
  favoriteCollections: number;
}

export interface CreatedCollection {
  id: string;
  name: string;
  description: string | null;
}

// A collection the item forms can add an item to.
export interface CollectionOption {
  id: string;
  name: string;
}

export type CollectionOptionsResult =
  | { success: true; data: CollectionOption[] }
  | { success: false; error: string };

export interface CreateCollectionInput {
  name: string;
  description?: string | null;
}

export type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<keyof CreateCollectionInput, string[]>>;
    };

export type UpdateCollectionInput = CreateCollectionInput;

export type UpdateCollectionResult = CreateCollectionResult;

export type DeleteCollectionResult = { success: true } | { success: false; error: string };
