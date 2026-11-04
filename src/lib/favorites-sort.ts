export const FAVORITE_SORT_KEYS = ["name", "date", "type"] as const;

export type FavoriteSortKey = (typeof FAVORITE_SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface FavoriteSort {
  key: FavoriteSortKey;
  direction: SortDirection;
}

// The direction each key starts in when picked: A→Z for text, newest first for dates.
export const DEFAULT_SORT_DIRECTIONS: Record<FavoriteSortKey, SortDirection> = {
  name: "asc",
  date: "desc",
  type: "asc",
};

// Matches the order the favorites come from the server in.
export const DEFAULT_FAVORITE_SORT: FavoriteSort = { key: "date", direction: "desc" };

// The fields a favorite row is sorted on.
export interface SortableFavorite {
  name: string;
  // null for collections without a type; always sorted last.
  typeName: string | null;
  date: Date;
}

// A fixed locale, so the server render and the browser sort the same way.
const COLLATOR = new Intl.Collator("en", { sensitivity: "base" });

function isSortKey(value: string | null): value is FavoriteSortKey {
  return FAVORITE_SORT_KEYS.some((key) => key === value);
}

// The sort from the `sort` and `dir` search params; unknown values fall back to the defaults.
export function parseFavoriteSort(sort: string | null, dir: string | null): FavoriteSort {
  if (!isSortKey(sort)) return DEFAULT_FAVORITE_SORT;
  const direction = dir === "asc" || dir === "desc" ? dir : DEFAULT_SORT_DIRECTIONS[sort];
  return { key: sort, direction };
}

// Picking the active key flips its direction; picking another key starts it in its default.
export function getNextFavoriteSort(current: FavoriteSort, key: FavoriteSortKey): FavoriteSort {
  if (current.key !== key) return { key, direction: DEFAULT_SORT_DIRECTIONS[key] };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

// The query string for a sort; the default sort drops both params for a clean URL.
export function getFavoriteSortSearch(params: URLSearchParams, sort: FavoriteSort): string {
  const query = new URLSearchParams(params);
  const isDefault =
    sort.key === DEFAULT_FAVORITE_SORT.key && sort.direction === DEFAULT_FAVORITE_SORT.direction;

  if (isDefault) {
    query.delete("sort");
    query.delete("dir");
  } else {
    query.set("sort", sort.key);
    query.set("dir", sort.direction);
  }

  const search = query.toString();
  return search ? `?${search}` : "";
}

function compareByKey(a: SortableFavorite, b: SortableFavorite, key: FavoriteSortKey): number {
  if (key === "name") return COLLATOR.compare(a.name, b.name);
  if (key === "date") return a.date.getTime() - b.date.getTime();
  return COLLATOR.compare(a.typeName ?? "", b.typeName ?? "");
}

// A sorted copy; ties are broken by name A→Z, and rows without a type stay last when sorting by type.
export function sortFavorites<T>(
  rows: readonly T[],
  sort: FavoriteSort,
  toSortable: (row: T) => SortableFavorite
): T[] {
  const sign = sort.direction === "asc" ? 1 : -1;

  return rows.toSorted((rowA, rowB) => {
    const a = toSortable(rowA);
    const b = toSortable(rowB);

    if (sort.key === "type" && (a.typeName === null) !== (b.typeName === null)) {
      return a.typeName === null ? 1 : -1;
    }

    return sign * compareByKey(a, b, sort.key) || COLLATOR.compare(a.name, b.name);
  });
}
