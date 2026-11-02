import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { getItemDetail, getItemTypeName, updateItem } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

const tx = vi.hoisted(() => ({
  tag: { createMany: vi.fn(), findMany: vi.fn() },
  item: { update: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { findFirst: vi.fn() },
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
