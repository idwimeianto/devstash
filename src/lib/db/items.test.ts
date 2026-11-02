import { beforeEach, describe, expect, it, vi } from "vitest";

import { getItemDetail } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: { item: { findFirst: vi.fn() } } }));

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
