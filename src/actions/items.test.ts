import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createItem,
  deleteItem,
  setItemFavorite,
  setItemPinned,
  updateItem,
} from "@/actions/items";
import { areUserCollections } from "@/lib/db/collections";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemTypeName,
  isFileUrlInUse,
  setItemFavorite as setItemFavoriteQuery,
  setItemPinned as setItemPinnedQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import { deleteObject, getObjectSize } from "@/lib/r2";
import { checkItemCreation } from "@/lib/usage-checks";
import { ITEM_LIMIT_REACHED, PRO_FEATURE_REQUIRED } from "@/lib/usage-limits";
import type { CreateItemInput, ItemDetail, UpdateItemInput } from "@/types/items";

vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  getItemTypeName: vi.fn(),
  isFileUrlInUse: vi.fn(),
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
  updateItem: vi.fn(),
}));
vi.mock("@/lib/db/collections", () => ({ areUserCollections: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
// Keep the real URL helpers; only the calls to R2 are faked.
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  getObjectSize: vi.fn(),
  deleteObject: vi.fn(),
}));
// The plan rules themselves are covered in usage-checks.test.ts.
vi.mock("@/lib/usage-checks", () => ({ checkItemCreation: vi.fn() }));

const USER_ID = "user_1";
const ITEM_ID = "item_1";
const PUBLIC_URL = "https://pub-test.r2.dev";
const UPLOAD_MISSING = "The uploaded file wasn't found. Please upload it again.";
const COLLECTION_NOT_FOUND = "A selected collection doesn't exist anymore. Please choose again.";

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

describe("createItem action", () => {
  const CREATE_INPUT: CreateItemInput = { ...INPUT, typeName: "snippet" };

  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(createItemQuery).mockResolvedValue(UPDATED);
    vi.mocked(checkItemCreation).mockResolvedValue(null);
  });

  it("creates the validated item for the session user and returns it with ISO dates", async () => {
    const result = await createItem(CREATE_INPUT);

    expect(checkItemCreation).toHaveBeenCalledWith(USER_ID, "snippet");
    expect(createItemQuery).toHaveBeenCalledWith(USER_ID, {
      typeName: "snippet",
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

  it("ignores fields the chosen type doesn't have", async () => {
    await createItem({ ...CREATE_INPUT, typeName: "link", url: "https://ui.shadcn.com" });

    expect(createItemQuery).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        typeName: "link",
        content: undefined,
        language: undefined,
        url: "https://ui.shadcn.com",
      }),
    );
  });

  it.each([
    ["the item limit is reached", ITEM_LIMIT_REACHED, "snippet"],
    ["a free user creates an upload type", PRO_FEATURE_REQUIRED, "image"],
  ] as const)("refuses without saving when %s", async (_case, message, typeName) => {
    vi.mocked(checkItemCreation).mockResolvedValue(message);

    const result = await createItem({
      ...CREATE_INPUT,
      typeName,
      file:
        typeName === "image"
          ? { fileUrl: `${PUBLIC_URL}/${USER_ID}/a.png`, fileName: "a.png" }
          : undefined,
    });

    expect(result).toEqual({ success: false, error: message });
    expect(checkItemCreation).toHaveBeenCalledWith(USER_ID, typeName);
    expect(getObjectSize).not.toHaveBeenCalled();
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns a generic error when the plan check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(checkItemCreation).mockRejectedValue(new Error("connection lost"));

    expect(await createItem(CREATE_INPUT)).toEqual({ success: false, error: GENERIC_ERROR });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input without touching the database", async () => {
    const result = await createItem({ ...CREATE_INPUT, typeName: "link", url: "" });

    expect(result).toEqual({
      success: false,
      error: "URL is required",
      fieldErrors: { url: ["URL is required"] },
    });
    expect(getSessionUserId).not.toHaveBeenCalled();
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("adds the item to the user's collections, deduplicated", async () => {
    vi.mocked(areUserCollections).mockResolvedValue(true);

    await createItem({ ...CREATE_INPUT, collectionIds: ["col_1", "col_2", "col_1"] });

    expect(areUserCollections).toHaveBeenCalledWith(USER_ID, ["col_1", "col_2"]);
    expect(createItemQuery).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ collectionIds: ["col_1", "col_2"] }),
    );
  });

  it("rejects a collection that isn't the user's", async () => {
    vi.mocked(areUserCollections).mockResolvedValue(false);

    const result = await createItem({ ...CREATE_INPUT, collectionIds: ["someone_elses"] });

    expect(result).toEqual({
      success: false,
      error: COLLECTION_NOT_FOUND,
      fieldErrors: { collectionIds: [COLLECTION_NOT_FOUND] },
    });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("skips the collection check when no collections are sent", async () => {
    await createItem(CREATE_INPUT);

    expect(areUserCollections).not.toHaveBeenCalled();
    expect(vi.mocked(createItemQuery).mock.calls[0][1].collectionIds).toBeUndefined();
  });

  it("returns a generic error when the collection check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(areUserCollections).mockRejectedValue(new Error("connection lost"));

    const result = await createItem({ ...CREATE_INPUT, collectionIds: ["col_1"] });

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects a type that can't be created", async () => {
    const result = await createItem({ ...CREATE_INPUT, typeName: "recipe" });

    expect(result).toMatchObject({ success: false, fieldErrors: { typeName: ["Choose a type"] } });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  describe("with an upload", () => {
    const FILE_URL = `${PUBLIC_URL}/${USER_ID}/abc-123.png`;
    const IMAGE_INPUT: CreateItemInput = {
      typeName: "image",
      title: "Diagram",
      description: "",
      tags: [],
      file: { fileUrl: FILE_URL, fileName: "diagram.png" },
    };

    beforeEach(() => {
      vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
      vi.mocked(getObjectSize).mockResolvedValue(4096);
      vi.mocked(isFileUrlInUse).mockResolvedValue(false);
    });

    it("stores the upload with the size read from R2", async () => {
      await createItem(IMAGE_INPUT);

      expect(getObjectSize).toHaveBeenCalledWith(`${USER_ID}/abc-123.png`);
      expect(createItemQuery).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({
          typeName: "image",
          file: { fileUrl: FILE_URL, fileName: "diagram.png", fileSize: 4096 },
        }),
      );
    });

    it("requires an upload for file and image items", async () => {
      const result = await createItem({ ...IMAGE_INPUT, file: undefined });

      expect(result).toMatchObject({ success: false, fieldErrors: { file: ["Upload a file"] } });
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("rejects another user's upload, a foreign URL or the wrong kind", async () => {
      for (const fileUrl of [
        `${PUBLIC_URL}/user_2/abc-123.png`,
        "https://evil.example/user_1/abc-123.png",
        `${PUBLIC_URL}/${USER_ID}/abc-123.pdf`,
      ]) {
        const result = await createItem({ ...IMAGE_INPUT, file: { fileUrl, fileName: "x.png" } });

        expect(result).toMatchObject({ success: false, fieldErrors: { file: [UPLOAD_MISSING] } });
      }
      expect(getObjectSize).not.toHaveBeenCalled();
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("rejects an upload that isn't in R2", async () => {
      vi.mocked(getObjectSize).mockResolvedValue(null);

      const result = await createItem(IMAGE_INPUT);

      expect(result).toMatchObject({ success: false, error: UPLOAD_MISSING });
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("rejects an upload another item already uses", async () => {
      vi.mocked(isFileUrlInUse).mockResolvedValue(true);

      const result = await createItem(IMAGE_INPUT);

      expect(isFileUrlInUse).toHaveBeenCalledWith(USER_ID, FILE_URL);
      expect(result).toMatchObject({
        success: false,
        fieldErrors: { file: ["This file already belongs to another item. Please upload it again."] },
      });
      expect(createItemQuery).not.toHaveBeenCalled();
    });

    it("drops an upload sent with a type that has none", async () => {
      await createItem({ ...CREATE_INPUT, file: IMAGE_INPUT.file });

      expect(getObjectSize).not.toHaveBeenCalled();
      expect(createItemQuery).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ typeName: "snippet", file: undefined }),
      );
    });
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const result = await createItem(CREATE_INPUT);

    expect(result).toEqual({ success: false, error: "You're not signed in. Please sign in again." });
    expect(createItemQuery).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(createItemQuery).mockRejectedValue(new Error("connection lost"));

    const result = await createItem(CREATE_INPUT);

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});

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

  it("requires a URL when the item is a link, but leaves an unsent URL as is", async () => {
    vi.mocked(getItemTypeName).mockResolvedValue("link");

    const result = await updateItem(ITEM_ID, { ...INPUT, url: "  " });

    expect(result).toEqual({
      success: false,
      error: "URL is required",
      fieldErrors: { url: ["URL is required"] },
    });
    expect(updateItemQuery).not.toHaveBeenCalled();

    await updateItem(ITEM_ID, INPUT);
    expect(updateItemQuery).toHaveBeenCalledWith(
      USER_ID,
      ITEM_ID,
      expect.objectContaining({ url: undefined }),
    );
  });

  it("replaces the item's collections after checking they are the user's", async () => {
    vi.mocked(areUserCollections).mockResolvedValue(true);

    await updateItem(ITEM_ID, { ...INPUT, collectionIds: ["col_1"] });

    expect(areUserCollections).toHaveBeenCalledWith(USER_ID, ["col_1"]);
    expect(updateItemQuery).toHaveBeenCalledWith(
      USER_ID,
      ITEM_ID,
      expect.objectContaining({ collectionIds: ["col_1"] }),
    );
  });

  it("leaves the collections alone when none are sent", async () => {
    await updateItem(ITEM_ID, INPUT);

    expect(areUserCollections).not.toHaveBeenCalled();
    expect(vi.mocked(updateItemQuery).mock.calls[0][2].collectionIds).toBeUndefined();
  });

  it("rejects a collection that isn't the user's without saving", async () => {
    vi.mocked(areUserCollections).mockResolvedValue(false);

    const result = await updateItem(ITEM_ID, { ...INPUT, collectionIds: ["someone_elses"] });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: { collectionIds: [COLLECTION_NOT_FOUND] },
    });
    expect(updateItemQuery).not.toHaveBeenCalled();
  });

  it("returns a generic error when the collection check fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(areUserCollections).mockRejectedValue(new Error("connection lost"));

    const result = await updateItem(ITEM_ID, { ...INPUT, collectionIds: ["col_1"] });

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
    expect(updateItemQuery).not.toHaveBeenCalled();
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

describe("deleteItem action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileUrl: null });
    vi.mocked(isFileUrlInUse).mockResolvedValue(false);
  });

  it("deletes the session user's item", async () => {
    const result = await deleteItem(ITEM_ID);

    expect(deleteItemQuery).toHaveBeenCalledWith(USER_ID, ITEM_ID);
    expect(result).toEqual({ success: true });
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it("also deletes the item's file from R2", async () => {
    vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileUrl: `${PUBLIC_URL}/${USER_ID}/abc.pdf` });

    const result = await deleteItem(ITEM_ID);

    expect(deleteObject).toHaveBeenCalledWith(`${USER_ID}/abc.pdf`);
    expect(result).toEqual({ success: true });
  });

  it("keeps the file in R2 while another item still uses it", async () => {
    vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
    const fileUrl = `${PUBLIC_URL}/${USER_ID}/abc.pdf`;
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileUrl });
    vi.mocked(isFileUrlInUse).mockResolvedValue(true);

    const result = await deleteItem(ITEM_ID);

    expect(isFileUrlInUse).toHaveBeenCalledWith(USER_ID, fileUrl);
    expect(deleteObject).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("still succeeds when deleting the file from R2 fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("R2_PUBLIC_URL", PUBLIC_URL);
    vi.mocked(deleteItemQuery).mockResolvedValue({ fileUrl: `${PUBLIC_URL}/${USER_ID}/abc.pdf` });
    vi.mocked(deleteObject).mockRejectedValue(new Error("R2 down"));

    await expect(deleteItem(ITEM_ID)).resolves.toEqual({ success: true });
  });

  it("rejects a missing item id without touching the database", async () => {
    const result = await deleteItem("");

    expect(result).toEqual({ success: false, error: "This item doesn't exist or was deleted." });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: false, error: "You're not signed in. Please sign in again." });
    expect(deleteItemQuery).not.toHaveBeenCalled();
  });

  it("returns not found for another user's or a missing item", async () => {
    vi.mocked(deleteItemQuery).mockResolvedValue(null);

    const result = await deleteItem("someone_elses_item");

    expect(result).toEqual({ success: false, error: "This item doesn't exist or was deleted." });
  });

  it("returns a generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(deleteItemQuery).mockRejectedValue(new Error("connection lost"));

    const result = await deleteItem(ITEM_ID);

    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});

describe("setItemFavorite action", () => {
  const NOT_FOUND = "This item doesn't exist or was deleted.";

  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(setItemFavoriteQuery).mockResolvedValue(true);
  });

  it("sets the favorite on the session user's item and returns the new value", async () => {
    await expect(setItemFavorite(ITEM_ID, false)).resolves.toEqual({
      success: true,
      data: { isFavorite: false },
    });
    expect(setItemFavoriteQuery).toHaveBeenCalledWith(USER_ID, ITEM_ID, false);
  });

  it("rejects an empty id or a non-boolean value without touching the database", async () => {
    await expect(setItemFavorite("", true)).resolves.toEqual({ success: false, error: NOT_FOUND });
    await expect(setItemFavorite(ITEM_ID, 1 as never)).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
    expect(setItemFavoriteQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    await expect(setItemFavorite(ITEM_ID, true)).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(setItemFavoriteQuery).not.toHaveBeenCalled();
  });

  it("reports a missing or another user's item as not found", async () => {
    vi.mocked(setItemFavoriteQuery).mockResolvedValue(false);

    await expect(setItemFavorite("someone_elses", true)).resolves.toEqual({
      success: false,
      error: NOT_FOUND,
    });
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(setItemFavoriteQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(setItemFavorite(ITEM_ID, true)).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});

describe("setItemPinned action", () => {
  const NOT_FOUND = "This item doesn't exist or was deleted.";

  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(setItemPinnedQuery).mockResolvedValue(true);
  });

  it("sets the pin on the session user's item and returns the new value", async () => {
    await expect(setItemPinned(ITEM_ID, true)).resolves.toEqual({
      success: true,
      data: { isPinned: true },
    });
    expect(setItemPinnedQuery).toHaveBeenCalledWith(USER_ID, ITEM_ID, true);
  });

  it("rejects an empty id or a non-boolean value without touching the database", async () => {
    await expect(setItemPinned("", true)).resolves.toEqual({ success: false, error: NOT_FOUND });
    await expect(setItemPinned(ITEM_ID, "yes" as never)).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
    expect(setItemPinnedQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    await expect(setItemPinned(ITEM_ID, true)).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(setItemPinnedQuery).not.toHaveBeenCalled();
  });

  it("reports a missing or another user's item as not found", async () => {
    vi.mocked(setItemPinnedQuery).mockResolvedValue(false);

    await expect(setItemPinned("someone_elses", false)).resolves.toEqual({
      success: false,
      error: NOT_FOUND,
    });
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(setItemPinnedQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(setItemPinned(ITEM_ID, true)).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});
