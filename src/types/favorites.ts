export type SetFavoriteResult =
  | { success: true; data: { isFavorite: boolean } }
  | { success: false; error: string };
