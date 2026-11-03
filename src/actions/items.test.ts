import { beforeEach, describe, expect, it, vi } from "vitest";

import { createItem, deleteItem, updateItem } from "@/actions/items";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  getItemTypeName,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { getSessionUserId } from "@/lib/db/users";
import { deleteObject, getObjectSize } from "@/lib/r2";
import type { CreateItemInput, ItemDetail, UpdateItemInput } from "@/types/items";

vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  deleteItem: vi.fn(),
  getItemTypeName: vi.fn(),
  updateItem: vi.fn(),
}));
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
// Keep the real URL helpers; only the calls to R2 are faked.
vi.mock("@/lib/r2", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/r2")>()),
  getObjectSize: vi.fn(),
  deleteObject: vi.fn(),
}));

const USER_ID = "user_1";
const ITEM_ID = "item_1";
const PUBLIC_URL = "https://pub-test.r2.dev";
const UPLOAD_MISSING = "The uploaded file wasn't found. Please upload it again.";

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
  });

  it("creates the validated item for the session user and returns it with ISO dates", async () => {
    const result = await createItem(CREATE_INPUT);

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
