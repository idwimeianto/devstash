export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;

// The dashboard shows a fixed number of each, without pagination.
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

export interface Page<T> {
  rows: T[];
  total: number;
  // 1-based, clamped to the last page.
  page: number;
  pageCount: number;
}

export type PageNumber = number | "ellipsis";

// A positive whole number from a search param, else page 1.
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

// Always at least one page, so an empty list still has page 1.
export function getPageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

// Fetches one page and the total in parallel; a page past the end falls back to the last page.
export async function paginate<T>(
  page: number,
  perPage: number,
  count: () => Promise<number>,
  find: (skip: number, take: number) => Promise<T[]>
): Promise<Page<T>> {
  const [total, rows] = await Promise.all([count(), find((page - 1) * perPage, perPage)]);
  const pageCount = getPageCount(total, perPage);
  if (page <= pageCount) return { rows, total, page, pageCount };

  return {
    rows: await find((pageCount - 1) * perPage, perPage),
    total,
    page: pageCount,
    pageCount,
  };
}

// First, last, and the current page with one neighbour each side; gaps become an ellipsis,
// except a gap of one page, which is shown as its number.
export function getPageNumbers(page: number, pageCount: number): PageNumber[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...shown].filter((n) => n >= 1 && n <= pageCount).toSorted((a, b) => a - b);

  const result: PageNumber[] = [];
  for (const n of pages) {
    const previous = result.at(-1);
    if (typeof previous === "number" && n - previous === 2) result.push(previous + 1);
    else if (typeof previous === "number" && n - previous > 2) result.push("ellipsis");
    result.push(n);
  }
  return result;
}

export type SearchParams = Record<string, string | string[] | undefined>;

interface PageHrefOptions {
  // Search param holding this list's page; other params are kept.
  param: string;
  // Element id to scroll to, for lists further down the page.
  hash?: string;
}

// Link to a page of a list; page 1 drops the param so the first page has a clean URL.
export function getPageHref(
  pathname: string,
  searchParams: SearchParams,
  page: number,
  { param, hash }: PageHrefOptions
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === param || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) query.append(key, v);
  }
  if (page > 1) query.set(param, String(page));

  const search = query.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}
