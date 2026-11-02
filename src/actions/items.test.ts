import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateItem } from "@/actions/items";
import { getItemTypeName, updateItem as updateItemQuery } from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import type { ItemDetail, UpdateItemInput } from "@/types/items";

vi.mock("@/lib/db/items", () => ({ getItemTypeName: vi.fn(), updateItem: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));

const USER_ID = "user_1";
const ITEM_ID = "item_1";

const INPUT: UpdateItemInput = {
  title: "  useAuth Hook  ",
  description: "",
  tags: ["react", "auth"],
  content: "export function useAuth() {}",
  language: "typescript",
};

const UPDATED: ItemDetail = {
  id: ITEM_ID,
  title: "useAuth Hook",
  description: null,
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  isPinned: false,
  isFavorite: false,
  typeName: "snippet",
  tags: ["auth", "react"],
  collections: [],
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-16T00:00:00Z"),
};

describe("updateItem action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(getItemTypeName).mockResolvedValue("snippet");
    vi.mocked(updateItemQuery).mockResolvedValue(UPDATED);
  });

  it("saves the validated fields and returns the item with ISO dates", async () => {
    const result = await updateItem(ITEM_ID, INPUT);

    expect(updateItemQuery).toHaveBeenCalledWith(USER_ID, ITEM_ID, {
      title: "useAuth Hook",
      description: null,
      tags: ["react", "auth"],
      content: "export function useAuth() {}",
      language: "typescript",
      url: undefined,
    });
    expect(result).toEqual({
      success: true,
      data: {
        ...UPDATED,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-16T00:00:00.000Z",
      },
    });
  });

  it("ignores fields the item's type doesn't have", async () => {
    vi.mocked(getItemTypeName).mockResolvedValue("link");

    await updateItem(ITEM_ID, { ...INPUT, url: "https://ui.shadcn.com" });

    expect(updateItemQuery).toHaveBeenCalledWith(
      USER_ID,
      ITEM_ID,
      expect.objectContaining({
        content: undefined,
        language: undefined,
        url: "https://ui.shadcn.com",
      }),
    );
  });

  it("returns field errors for invalid input without touching the database", async () => {
    const result = await updateItem(ITEM_ID, { ...INPUT, title: " ", url: "not a url" });

    expect(result).toEqual({
      success: false,
      error: "Title is required",
      fieldErrors: { title: ["Title is required"], url: ["Enter a valid URL"] },
    });
    expect(getSessionUserId).not.toHaveBeenCalled();
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects a malformed payload sent outside the form", async () => {
    // Server actions can be called directly with any arguments.
    const payload = { title: "Hook", description: null, tags: "react" } as unknown as UpdateItemInput;

    const result = await updateItem(ITEM_ID, payload);

    expect(result).toMatchObject({ success: false, fieldErrors: { tags: [expect.any(String)] } });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const result = await updateItem(ITEM_ID, INPUT);

    expect(result).toEqual({ success: false, error: "You're not signed in. Please sign in again." });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found for another user's item", async () => {
    vi.mocked(getItemTypeName).mockResolvedValue(null);

    const result = await updateItem("someone_elses_item", INPUT);

    expect(result).toEqual({ success: false, error: "This item doesn't exist or was deleted." });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found when the item disappears before the update", async () => {
    vi.mocked(updateItemQuery).mockResolvedValue(null);

    const result = await updateItem(ITEM_ID, INPUT);

    expect(result).toEqual({ success: false, error: "This item doesn't exist or was deleted." });
  });

  it("returns a generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(updateItemQuery).mockRejectedValue(new Error("connection lost"));

    const result = await updateItem(ITEM_ID, INPUT);

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});
