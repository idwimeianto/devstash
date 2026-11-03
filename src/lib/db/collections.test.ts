import { describe, expect, it, vi } from "vitest";

import { getRecentCollections, getSidebarCollections } from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: { collection: { findMany: vi.fn() } } }));

const SNIPPET = { id: "t_snippet", name: "snippet", icon: "Code", color: "#3b82f6" };
const LINK = { id: "t_link", name: "link", icon: "Link", color: "#10b981" };

function collection(id: string, isFavorite: boolean, types: (typeof SNIPPET)[], defaultType?: string) {
  return {
    id,
    name: `Collection ${id}`,
    description: null,
    isFavorite,
    defaultType: defaultType ? { name: defaultType } : null,
    items: types.map((type) => ({ item: { type } })),
  };
}

describe("getRecentCollections", () => {
  it("counts items, ranks types by use and picks the most-used as the main type", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      collection("c1", true, [LINK, SNIPPET, LINK], "snippet"),
    ] as never);

    const [summary] = await getRecentCollections("user_1");

    expect(summary).toEqual({
      id: "c1",
      name: "Collection c1",
      description: null,
      isFavorite: true,
      itemCount: 3,
      types: [LINK, SNIPPET],
      mainTypeName: "link",
    });
    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_1" }, take: 6 }),
    );
  });

  it("falls back to the default type when the collection is empty", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      collection("c1", false, [], "prompt"),
      collection("c2", false, []),
    ] as never);

    const summaries = await getRecentCollections("user_1");

    expect(summaries.map((summary) => summary.mainTypeName)).toEqual(["prompt", null]);
  });
});

describe("getSidebarCollections", () => {
  it("lists every favorite and the 5 newest other collections", async () => {
    vi.mocked(prisma.collection.findMany).mockResolvedValue([
      collection("f1", true, [SNIPPET]),
      ...["r1", "r2", "r3", "r4", "r5", "r6"].map((id) => collection(id, false, [LINK])),
    ] as never);

    const { favorites, recent } = await getSidebarCollections("user_1");

    expect(favorites).toEqual([
      { id: "f1", name: "Collection f1", itemCount: 1, mainTypeName: "snippet" },
    ]);
    expect(recent.map((item) => item.id)).toEqual(["r1", "r2", "r3", "r4", "r5"]);
    expect(recent[0]).toEqual({ id: "r1", name: "Collection r1", itemCount: 1, mainTypeName: "link" });
  });
});
