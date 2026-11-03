import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getItemTypeName,
  isFileUrlInUse,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

const tx = vi.hoisted(() => ({
  tag: { createMany: vi.fn(), findMany: vi.fn() },
  item: { update: vi.fn(), create: vi.fn() },
  itemType: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst: vi.fn(), delete: vi.fn(), count: vi.fn() },
    // Runs the callback against the mocked transaction client.
    $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)),
  },
}));

const USER_ID = "user_1";
const ITEM_ID = "item_1";
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
        },
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
