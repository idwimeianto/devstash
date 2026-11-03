import { describe, expect, it, vi } from "vitest";

import {
  getPageCount,
  getPageHref,
  getPageNumbers,
  paginate,
  parsePage,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("reads a positive whole number", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["4", "9"])).toBe(4);
  });

  it.each([undefined, "", "0", "-2", "1.5", "abc", "2abc", "99999999999999999999"])(
    "falls back to page 1 for %j",
    (value) => {
      expect(parsePage(value)).toBe(1);
    }
  );
});

describe("getPageCount", () => {
  it("rounds up and never returns less than one page", () => {
    expect(getPageCount(0, 21)).toBe(1);
    expect(getPageCount(21, 21)).toBe(1);
    expect(getPageCount(22, 21)).toBe(2);
  });
});

describe("paginate", () => {
  it("fetches the page's rows and the total in parallel", async () => {
    const find = vi.fn().mockResolvedValue(["c", "d"]);

    const page = await paginate(2, 2, async () => 5, find);

    expect(find).toHaveBeenCalledExactlyOnceWith(2, 2);
    expect(page).toEqual({ rows: ["c", "d"], total: 5, page: 2, pageCount: 3 });
  });

  it("falls back to the last page when the page is past the end", async () => {
    const find = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(["e"]);

    const page = await paginate(9, 2, async () => 5, find);

    expect(find).toHaveBeenLastCalledWith(4, 2);
    expect(page).toEqual({ rows: ["e"], total: 5, page: 3, pageCount: 3 });
  });

  it("returns an empty first page when there is nothing", async () => {
    const page = await paginate(1, 21, async () => 0, async () => []);

    expect(page).toEqual({ rows: [], total: 0, page: 1, pageCount: 1 });
  });
});

describe("getPageNumbers", () => {
  it("lists every page when there are few", () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses long gaps around the current page into an ellipsis", () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageNumbers(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(getPageNumbers(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });

  it("shows a single hidden page as its number instead of an ellipsis", () => {
    expect(getPageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
  });
});

describe("getPageHref", () => {
  it("sets the page param and keeps the other params", () => {
    expect(getPageHref("/collections/c1", { filesPage: "2" }, 3, { param: "page" })).toBe(
      "/collections/c1?filesPage=2&page=3"
    );
  });

  it("drops the param for page 1 and replaces an existing value", () => {
    expect(getPageHref("/items/snippets", { page: "4" }, 1, { param: "page" })).toBe(
      "/items/snippets"
    );
  });

  it("adds the hash to scroll to the list", () => {
    expect(
      getPageHref("/collections/c1", { page: "2" }, 2, { param: "imagesPage", hash: "images" })
    ).toBe("/collections/c1?page=2&imagesPage=2#images");
  });
});
