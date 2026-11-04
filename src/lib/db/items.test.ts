import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getFavoriteItems,
  getItemDetail,
  getItemFile,
  getItemsByCollection,
  getItemsByType,
  getItemTypeName,
  getRecentItems,
  getSearchItems,
  isFileUrlInUse,
  setItemFavorite,
  setItemPinned,
  updateItem,
} from "@/lib/db/items";
import { ITEMS_PER_PAGE } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const tx = vi.hoisted(() => ({
  tag: { createMany: vi.fn(), findMany: vi.fn() },
  item: { update: vi.fn(), create: vi.fn() },
  itemType: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    // Runs the callback against the mocked transaction client.
    $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)),
  },
}));

const USER_ID = "user_1";
const ITEM_ID = "item_1";
const RECENT_ORDER = [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
const PINNED_FIRST_ORDER = [{ isPinned: "desc" }, ...RECENT_ORDER];
const CREATED_AT = new Date("2026-01-15T00:00:00Z");
const UPDATED_AT = new Date("2026-01-16T00:00:00Z");

const ROW = {
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
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  type: { name: "snippet" },
  tags: [{ name: "auth" }, { name: "react" }],
  collections: [
    { collection: { id: "col_1", name: "Interview Prep" } },
    { collection: { id: "col_2", name: "React Patterns" } },
  ],
};

describe("setItemFavorite", () => {
  it("updates only the user's item and reports whether it was found", async () => {
    vi.mocked(prisma.item.updateMany).mockResolvedValue({ count: 1 });

    await expect(setItemFavorite(USER_ID, ITEM_ID, true)).resolves.toBe(true);
    expect(prisma.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID },
      data: { isFavorite: true },
    });

    vi.mocked(prisma.item.updateMany).mockResolvedValue({ count: 0 });
    await expect(setItemFavorite(USER_ID, "someone_elses", false)).resolves.toBe(false);
  });
});

describe("setItemPinned", () => {
  it("updates only the user's item and reports whether it was found", async () => {
    vi.mocked(prisma.item.updateMany).mockResolvedValue({ count: 1 });

    await expect(setItemPinned(USER_ID, ITEM_ID, true)).resolves.toBe(true);
    expect(prisma.item.updateMany).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID },
      data: { isPinned: true },
    });

    vi.mocked(prisma.item.updateMany).mockResolvedValue({ count: 0 });
    await expect(setItemPinned(USER_ID, "someone_elses", false)).resolves.toBe(false);
  });
});

describe("getRecentItems", () => {
  it("lists the user's unpinned items, most recently used first, up to the limit", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([{ ...ROW, isPinned: false }] as never);

    const items = await getRecentItems(USER_ID, 5);

    expect(items).toEqual([expect.objectContaining({ id: ITEM_ID, isPinned: false })]);
    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, isPinned: false },
        orderBy: RECENT_ORDER,
        take: 5,
      })
    );
  });
});

describe("getFavoriteItems", () => {
  it("lists the user's favorite items, most recently updated first, with their type name", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { id: "a", title: "useAuth", updatedAt: UPDATED_AT, type: { name: "snippet" } },
    ] as never);

    const items = await getFavoriteItems(USER_ID);

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, isFavorite: true },
        orderBy: { updatedAt: "desc" },
      })
    );
    expect(items).toEqual([
      { id: "a", title: "useAuth", typeName: "snippet", updatedAt: UPDATED_AT },
    ]);
  });
});

describe("getSearchItems", () => {
  it("lists every item of the user with a one-line preview", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { id: "a", title: "useAuth", description: null, content: "export function\n  useAuth() {}", url: null, fileName: null, type: { name: "snippet" } },
      { id: "b", title: "Lucide", description: "Icon set", content: null, url: "https://lucide.dev", fileName: null, type: { name: "link" } },
      { id: "c", title: "Empty", description: null, content: "", url: null, fileName: null, type: { name: "note" } },
    ] as never);

    const items = await getSearchItems(USER_ID);

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
    expect(items).toEqual([
      { id: "a", title: "useAuth", typeName: "snippet", preview: "export function useAuth() {}" },
      { id: "b", title: "Lucide", typeName: "link", preview: "Icon set" },
      { id: "c", title: "Empty", typeName: "note", preview: null },
    ]);
  });

  it("falls back to the URL, then the file name, for the preview", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { id: "a", title: "Docs", description: null, content: null, url: "https://docs.docker.com", fileName: null, type: { name: "link" } },
      { id: "b", title: "Notes", description: "  ", content: null, url: null, fileName: "notes.md", type: { name: "file" } },
    ] as never);

    const items = await getSearchItems(USER_ID);

    expect(items.map((item) => item.preview)).toEqual(["https://docs.docker.com", "notes.md"]);
  });
});

describe("getItemsByType", () => {
  const IMAGE_URL = "https://pub.example.r2.dev/user_1/abc.png";
  const LAST_USED_AT = new Date("2026-02-01T00:00:00Z");

  beforeEach(() => {
    vi.mocked(prisma.item.count).mockResolvedValue(4);
  });

  it("only lists the user's items of that type", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    await getItemsByType(USER_ID, "type_image", 1);

    const where = { userId: USER_ID, typeId: "type_image" };
    expect(prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(prisma.item.count).toHaveBeenCalledWith({ where });
  });

  it("fetches only the requested page and returns the total", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(50);
    vi.mocked(prisma.item.findMany).mockResolvedValue([ROW] as never);

    const page = await getItemsByType(USER_ID, "type_snippet", 2);

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: PINNED_FIRST_ORDER,
        skip: ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      })
    );
    expect(page).toEqual(
      expect.objectContaining({ total: 50, page: 2, pageCount: 3, rows: [expect.objectContaining({ id: ITEM_ID })] })
    );
  });

  it("includes the file URL for thumbnails and dates by last use, then creation", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { ...ROW, id: "img_1", type: { name: "image" }, fileUrl: IMAGE_URL, lastUsedAt: LAST_USED_AT },
      { ...ROW, id: "img_2", type: { name: "image" }, fileUrl: null, lastUsedAt: null },
    ] as never);

    const { rows: items } = await getItemsByType(USER_ID, "type_image", 1);

    expect(items).toEqual([
      expect.objectContaining({ id: "img_1", typeName: "image", fileUrl: IMAGE_URL, date: LAST_USED_AT }),
      expect.objectContaining({ id: "img_2", fileUrl: null, date: CREATED_AT }),
    ]);
  });

  it("includes the file name, size and creation date for the file list", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      {
        ...ROW,
        type: { name: "file" },
        fileName: "notes.md",
        fileSize: 2048,
        lastUsedAt: LAST_USED_AT,
      },
    ] as never);

    const {
      rows: [item],
    } = await getItemsByType(USER_ID, "type_file", 1);

    expect(item).toEqual(
      expect.objectContaining({
        fileName: "notes.md",
        fileSize: 2048,
        createdAt: CREATED_AT,
        date: LAST_USED_AT,
      })
    );
  });

  it("copies the URL for links, the content for text and nothing when both are empty", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { ...ROW, id: "link_1", content: null, url: "https://ui.shadcn.com" },
      { ...ROW, id: "snippet_1" },
      { ...ROW, id: "file_1", content: null, fileUrl: IMAGE_URL },
      { ...ROW, id: "note_1", content: "" },
    ] as never);

    const { rows: items } = await getItemsByType(USER_ID, "type_any", 1);

    expect(items.map((item) => item.copyValue)).toEqual([
      "https://ui.shadcn.com",
      "export function useAuth() {}",
      null,
      null,
    ]);
  });
});

describe("getItemsByCollection", () => {
  beforeEach(() => {
    vi.mocked(prisma.item.count).mockResolvedValue(2);
  });

  it("lists the user's regular items in that collection, pinned then most recently used first", async () => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([
      { ...ROW, lastUsedAt: null },
      { ...ROW, id: "link_1", type: { name: "link" }, lastUsedAt: null },
    ] as never);

    const { rows: items, total } = await getItemsByCollection(USER_ID, "col_1", "items", 1);

    expect(items.map((item) => [item.id, item.typeName])).toEqual([
      [ITEM_ID, "snippet"],
      ["link_1", "link"],
    ]);
    expect(total).toBe(2);
    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: USER_ID,
          collections: { some: { collectionId: "col_1" } },
          type: { name: { notIn: ["file", "image"] } },
        },
        orderBy: PINNED_FIRST_ORDER,
        skip: 0,
        take: ITEMS_PER_PAGE,
      })
    );
  });

  it.each([
    ["files", "file"],
    ["images", "image"],
  ] as const)("limits the %s section to %s items", async (section, typeName) => {
    vi.mocked(prisma.item.findMany).mockResolvedValue([]);

    await getItemsByCollection(USER_ID, "col_1", section, 1);

    const where = {
      userId: USER_ID,
      collections: { some: { collectionId: "col_1" } },
      type: { name: typeName },
    };
    expect(prisma.item.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(prisma.item.count).toHaveBeenCalledWith({ where });
  });
});

describe("getItemDetail", () => {
  beforeEach(() => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(ROW as never);
  });

  it("only looks up the item among the user's own items", async () => {
    await getItemDetail(USER_ID, ITEM_ID);

    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ITEM_ID, userId: USER_ID } }),
    );
  });

  it("flattens the type, tags and collections", async () => {
    await expect(getItemDetail(USER_ID, ITEM_ID)).resolves.toEqual({
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
      collections: [
        { id: "col_1", name: "Interview Prep" },
        { id: "col_2", name: "React Patterns" },
      ],
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });
  });

  it("returns null for a missing item or another user's item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    await expect(getItemDetail(USER_ID, "someone_elses_item")).resolves.toBeNull();
  });
});

describe("getItemTypeName", () => {
  it("returns the type name of the user's own item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({ type: { name: "link" } } as never);

    await expect(getItemTypeName(USER_ID, ITEM_ID)).resolves.toBe("link");
    expect(prisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ITEM_ID, userId: USER_ID } }),
    );
  });

  it("returns null for a missing item or another user's item", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);

    await expect(getItemTypeName(USER_ID, ITEM_ID)).resolves.toBeNull();
  });
});

describe("createItem", () => {
  const DATA = {
    typeName: "snippet" as const,
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: undefined,
    tags: ["auth", "hooks"],
  };

  beforeEach(() => {
    tx.itemType.findFirst.mockResolvedValue({ id: "type_snippet" });
    tx.tag.findMany.mockResolvedValue([{ id: "tag_auth" }, { id: "tag_hooks" }]);
    tx.item.create.mockResolvedValue(ROW);
  });

  it("creates the item for the user with the system type, content kind and tags", async () => {
    await createItem(USER_ID, DATA);

    expect(tx.itemType.findFirst).toHaveBeenCalledWith({
      where: { name: "snippet", isSystem: true },
      select: { id: true },
    });
    expect(tx.tag.createMany).toHaveBeenCalledWith({
      data: [
        { name: "auth", userId: USER_ID },
        { name: "hooks", userId: USER_ID },
      ],
      skipDuplicates: true,
    });
    expect(tx.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          language: "typescript",
          url: undefined,
          contentType: "TEXT",
          userId: USER_ID,
          typeId: "type_snippet",
          tags: { connect: [{ id: "tag_auth" }, { id: "tag_hooks" }] },
          collections: { create: [] },
        },
      }),
    );
  });

  it("adds the item to the given collections", async () => {
    await createItem(USER_ID, { ...DATA, collectionIds: ["col_1", "col_2"] });

    expect(tx.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: { create: [{ collectionId: "col_1" }, { collectionId: "col_2" }] },
        }),
      }),
    );
  });

  it("stores links with the URL content kind", async () => {
    await createItem(USER_ID, { ...DATA, typeName: "link", url: "https://ui.shadcn.com" });

    expect(tx.item.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ contentType: "URL" }) }),
    );
  });

  it("stores images with the FILE content kind and the upload's fields", async () => {
    const file = {
      fileUrl: "https://pub-test.r2.dev/user_1/abc.png",
      fileName: "diagram.png",
      fileSize: 2048,
    };

    await createItem(USER_ID, {
      ...DATA,
      typeName: "image",
      content: undefined,
      language: undefined,
      file,
    });

    expect(tx.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ...file, contentType: "FILE" }),
      }),
    );
    expect(tx.item.create.mock.calls[0][0].data).not.toHaveProperty("file");
  });

  it("returns the new item in the drawer's shape", async () => {
    const item = await createItem(USER_ID, DATA);

    expect(item).toMatchObject({ id: ITEM_ID, typeName: "snippet", tags: ["auth", "react"] });
  });

  it("throws when the system type is missing", async () => {
    tx.itemType.findFirst.mockResolvedValue(null);

    await expect(createItem(USER_ID, DATA)).rejects.toThrow('Unknown system item type "snippet"');
    expect(tx.item.create).not.toHaveBeenCalled();
  });
});

describe("updateItem", () => {
  const DATA = {
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: undefined,
    tags: ["auth", "hooks"],
  };

  beforeEach(() => {
    tx.tag.findMany.mockResolvedValue([{ id: "tag_auth" }, { id: "tag_hooks" }]);
    tx.item.update.mockResolvedValue(ROW);
  });

  it("creates the user's missing tags and replaces the item's tags with them", async () => {
    await updateItem(USER_ID, ITEM_ID, DATA);

    expect(tx.tag.createMany).toHaveBeenCalledWith({
      data: [
        { name: "auth", userId: USER_ID },
        { name: "hooks", userId: USER_ID },
      ],
      skipDuplicates: true,
    });
    expect(tx.tag.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, name: { in: ["auth", "hooks"] } },
      select: { id: true },
    });
    expect(tx.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ITEM_ID, userId: USER_ID },
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          language: "typescript",
          url: undefined,
          tags: { set: [{ id: "tag_auth" }, { id: "tag_hooks" }] },
        },
      }),
    );
  });

  it("removes every tag when none are given", async () => {
    tx.tag.findMany.mockResolvedValue([]);

    await updateItem(USER_ID, ITEM_ID, { ...DATA, tags: [] });

    expect(tx.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tags: { set: [] } }),
      }),
    );
  });

  it("keeps the item's collections when none are sent", async () => {
    await updateItem(USER_ID, ITEM_ID, DATA);

    expect(tx.item.update.mock.calls[0][0].data).not.toHaveProperty("collections");
  });

  it("removes deselected collections and adds new ones, keeping the rest", async () => {
    await updateItem(USER_ID, ITEM_ID, { ...DATA, collectionIds: ["col_1", "col_3"] });

    expect(tx.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            deleteMany: { collectionId: { notIn: ["col_1", "col_3"] } },
            createMany: {
              data: [{ collectionId: "col_1" }, { collectionId: "col_3" }],
              skipDuplicates: true,
            },
          },
        }),
      }),
    );
  });

  it("removes the item from every collection when an empty list is sent", async () => {
    await updateItem(USER_ID, ITEM_ID, { ...DATA, collectionIds: [] });

    expect(tx.item.update.mock.calls[0][0].data.collections).toEqual({
      deleteMany: { collectionId: { notIn: [] } },
      createMany: { data: [], skipDuplicates: true },
    });
  });

  it("returns the updated item in the drawer's shape", async () => {
    const item = await updateItem(USER_ID, ITEM_ID, DATA);

    expect(item).toMatchObject({ id: ITEM_ID, typeName: "snippet", tags: ["auth", "react"] });
  });

  it("returns null when the item isn't the user's", async () => {
    tx.item.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("No record was found for an update.", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(updateItem(USER_ID, ITEM_ID, DATA)).resolves.toBeNull();
  });

  it("rethrows other database errors", async () => {
    tx.item.update.mockRejectedValue(new Error("connection lost"));

    await expect(updateItem(USER_ID, ITEM_ID, DATA)).rejects.toThrow("connection lost");
  });
});

describe("deleteItem", () => {
  it("only deletes the item among the user's own items and returns its file URL", async () => {
    const fileUrl = "https://pub-test.r2.dev/user_1/abc.png";
    vi.mocked(prisma.item.delete).mockResolvedValue({ fileUrl } as never);

    await expect(deleteItem(USER_ID, ITEM_ID)).resolves.toEqual({ fileUrl });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID },
      select: { fileUrl: true },
    });
  });

  it("returns null when the item isn't the user's", async () => {
    vi.mocked(prisma.item.delete).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("No record was found for a delete.", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(deleteItem(USER_ID, "someone_elses_item")).resolves.toBeNull();
  });

  it("rethrows other database errors", async () => {
    vi.mocked(prisma.item.delete).mockRejectedValue(new Error("connection lost"));

    await expect(deleteItem(USER_ID, ITEM_ID)).rejects.toThrow("connection lost");
  });
});

describe("isFileUrlInUse", () => {
  it("counts only the user's items with this file URL", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(1);

    await expect(isFileUrlInUse(USER_ID, "https://x/u/a.png")).resolves.toBe(true);
    expect(prisma.item.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, fileUrl: "https://x/u/a.png" },
    });
  });

  it("is false when no item uses it", async () => {
    vi.mocked(prisma.item.count).mockResolvedValue(0);

    await expect(isFileUrlInUse(USER_ID, "https://x/u/a.png")).resolves.toBe(false);
  });
});

describe("getItemFile", () => {
  it("looks up the file among the user's own file items", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue({
      fileUrl: "https://x/u/a.pdf",
      fileName: "spec.pdf",
    } as never);

    await expect(getItemFile(USER_ID, ITEM_ID)).resolves.toEqual({
      fileUrl: "https://x/u/a.pdf",
      fileName: "spec.pdf",
    });
    expect(prisma.item.findFirst).toHaveBeenCalledWith({
      where: { id: ITEM_ID, userId: USER_ID, contentType: "FILE" },
      select: { fileUrl: true, fileName: true },
    });
  });

  it("returns null for a missing item or one without a file", async () => {
    vi.mocked(prisma.item.findFirst).mockResolvedValue(null);
    await expect(getItemFile(USER_ID, ITEM_ID)).resolves.toBeNull();

    vi.mocked(prisma.item.findFirst).mockResolvedValue({ fileUrl: null, fileName: null } as never);
    await expect(getItemFile(USER_ID, ITEM_ID)).resolves.toBeNull();
  });
});
