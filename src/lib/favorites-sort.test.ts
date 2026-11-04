import { describe, expect, it } from "vitest";

import {
  DEFAULT_FAVORITE_SORT,
  getFavoriteSortSearch,
  getNextFavoriteSort,
  parseFavoriteSort,
  sortFavorites,
  type FavoriteSort,
  type SortableFavorite,
} from "@/lib/favorites-sort";

const ROWS: SortableFavorite[] = [
  { name: "beta", typeName: "snippet", date: new Date("2026-03-01") },
  { name: "Alpha", typeName: null, date: new Date("2026-01-01") },
  { name: "gamma", typeName: "link", date: new Date("2026-02-01") },
  { name: "delta", typeName: "snippet", date: new Date("2026-02-01") },
];

function namesSortedBy(sort: FavoriteSort): string[] {
  return sortFavorites(ROWS, sort, (row) => row).map((row) => row.name);
}

describe("parseFavoriteSort", () => {
  it("reads a key and direction", () => {
    expect(parseFavoriteSort("name", "desc")).toEqual({ key: "name", direction: "desc" });
  });

  it("uses the key's default direction when the direction is missing or invalid", () => {
    expect(parseFavoriteSort("name", null)).toEqual({ key: "name", direction: "asc" });
    expect(parseFavoriteSort("date", "up")).toEqual({ key: "date", direction: "desc" });
  });

  it.each([null, "", "title", "NAME"])("falls back to the default sort for %j", (sort) => {
    expect(parseFavoriteSort(sort, "asc")).toEqual(DEFAULT_FAVORITE_SORT);
  });
});

describe("getNextFavoriteSort", () => {
  it("flips the direction of the active key", () => {
    expect(getNextFavoriteSort({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
  });

  it("starts another key in its default direction", () => {
    expect(getNextFavoriteSort({ key: "name", direction: "desc" }, "date")).toEqual({
      key: "date",
      direction: "desc",
    });
    expect(getNextFavoriteSort(DEFAULT_FAVORITE_SORT, "type")).toEqual({
      key: "type",
      direction: "asc",
    });
  });
});

describe("getFavoriteSortSearch", () => {
  it("sets both params and keeps other params", () => {
    const search = getFavoriteSortSearch(new URLSearchParams("x=1"), {
      key: "type",
      direction: "desc",
    });
    expect(search).toBe("?x=1&sort=type&dir=desc");
  });

  it("drops both params for the default sort", () => {
    expect(
      getFavoriteSortSearch(new URLSearchParams("sort=name&dir=asc"), DEFAULT_FAVORITE_SORT)
    ).toBe("");
  });
});

describe("sortFavorites", () => {
  it("sorts by name, ignoring case", () => {
    expect(namesSortedBy({ key: "name", direction: "asc" })).toEqual([
      "Alpha",
      "beta",
      "delta",
      "gamma",
    ]);
    expect(namesSortedBy({ key: "name", direction: "desc" })).toEqual([
      "gamma",
      "delta",
      "beta",
      "Alpha",
    ]);
  });

  it("sorts by date with ties broken by name", () => {
    expect(namesSortedBy({ key: "date", direction: "desc" })).toEqual([
      "beta",
      "delta",
      "gamma",
      "Alpha",
    ]);
    expect(namesSortedBy({ key: "date", direction: "asc" })).toEqual([
      "Alpha",
      "delta",
      "gamma",
      "beta",
    ]);
  });

  it("groups by type with rows without a type last in both directions", () => {
    expect(namesSortedBy({ key: "type", direction: "asc" })).toEqual([
      "gamma",
      "beta",
      "delta",
      "Alpha",
    ]);
    expect(namesSortedBy({ key: "type", direction: "desc" })).toEqual([
      "beta",
      "delta",
      "gamma",
      "Alpha",
    ]);
  });

  it("returns a copy without changing the input", () => {
    const rows = [...ROWS];
    sortFavorites(rows, { key: "name", direction: "asc" }, (row) => row);
    expect(rows).toEqual(ROWS);
  });
});
