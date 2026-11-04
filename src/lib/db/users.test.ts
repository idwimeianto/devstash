import { describe, expect, it, vi } from "vitest";

import { getEditorPreferences, updateEditorPreferences } from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";
import type { EditorPreferences } from "@/types/editor-preferences";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const USER_ID = "user_1";
const PREFERENCES: EditorPreferences = {
  fontSize: 16,
  tabSize: 8,
  wordWrap: true,
  minimap: true,
  theme: "monokai",
};

describe("getEditorPreferences", () => {
  it("returns the defaults without a query when signed out", async () => {
    expect(await getEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("reads the user's stored preferences", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      editorPreferences: PREFERENCES,
    } as never);

    expect(await getEditorPreferences(USER_ID)).toEqual(PREFERENCES);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when nothing is stored or the user is gone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      editorPreferences: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    expect(await getEditorPreferences(USER_ID)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(await getEditorPreferences(USER_ID)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});

describe("updateEditorPreferences", () => {
  it("writes the preferences to the user's row", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 });

    expect(await updateEditorPreferences(USER_ID, PREFERENCES)).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { editorPreferences: PREFERENCES },
    });
  });

  it("returns false when the user no longer exists", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 });

    expect(await updateEditorPreferences(USER_ID, PREFERENCES)).toBe(false);
  });
});
