import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/items/[id]/route";
import { getItemDetail } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import type { ItemDetail } from "@/types/items";

vi.mock("@/lib/db/items", () => ({ getItemDetail: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));

const USER_ID = "user_1";
const ITEM_ID = "item_1";

const ITEM: ItemDetail = {
  id: ITEM_ID,
  title: "useAuth Hook",
  description: "Custom authentication hook",
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isPinned: true,
  isFavorite: false,
  typeName: "snippet",
  tags: ["auth", "react"],
  collections: [{ id: "col_1", name: "React Patterns" }],
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-16T00:00:00Z"),
};

function getItem(id = ITEM_ID) {
  return GET(new Request(`http://localhost/api/items/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(getItemDetail).mockResolvedValue(ITEM);
  });

  it("returns the signed-in user's item", async () => {
    const response = await getItem();

    expect(response.status).toBe(200);
    expect(getItemDetail).toHaveBeenCalledWith(USER_ID, ITEM_ID);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        ...ITEM,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-16T00:00:00.000Z",
      },
    });
  });

  it("returns 401 when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const response = await getItem();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(getItemDetail).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing item or another user's item", async () => {
    vi.mocked(getItemDetail).mockResolvedValue(null);

    const response = await getItem("someone_elses_item");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "This item doesn't exist or was deleted.",
    });
  });

  it("returns 500 when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getItemDetail).mockRejectedValue(new Error("connection lost"));

    const response = await getItem();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
