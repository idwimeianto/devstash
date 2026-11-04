import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import {
  getSessionUserId,
  updateEditorPreferences as updateEditorPreferencesQuery,
} from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";
import type { EditorPreferences } from "@/types/editor-preferences";

vi.mock("@/lib/db/users", () => ({
  getSessionUserId: vi.fn(),
  updateEditorPreferences: vi.fn(),
}));

const USER_ID = "user_1";
const PREFERENCES: EditorPreferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "github-dark",
};

describe("updateEditorPreferences action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(updateEditorPreferencesQuery).mockResolvedValue(true);
  });

  it("saves the preferences for the session user", async () => {
    const result = await updateEditorPreferences(PREFERENCES);

    expect(result).toEqual({ success: true, data: PREFERENCES });
    expect(updateEditorPreferencesQuery).toHaveBeenCalledWith(USER_ID, PREFERENCES);
  });

  it("rejects a value outside the allowed options without touching the database", async () => {
    const result = await updateEditorPreferences({
      ...PREFERENCES,
      fontSize: 15,
    } as unknown as EditorPreferences);

    expect(result).toEqual({ success: false, error: "Choose a font size" });
    expect(getSessionUserId).not.toHaveBeenCalled();
    expect(updateEditorPreferencesQuery).not.toHaveBeenCalled();
  });

  it("drops fields that aren't preferences", async () => {
    await updateEditorPreferences({ ...PREFERENCES, isPro: true } as EditorPreferences);

    expect(updateEditorPreferencesQuery).toHaveBeenCalledWith(USER_ID, PREFERENCES);
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const result = await updateEditorPreferences(PREFERENCES);

    expect(result).toEqual({ success: false, error: NOT_SIGNED_IN });
    expect(updateEditorPreferencesQuery).not.toHaveBeenCalled();
  });

  it("reports an account that no longer exists", async () => {
    vi.mocked(updateEditorPreferencesQuery).mockResolvedValue(false);

    const result = await updateEditorPreferences(PREFERENCES);

    expect(result).toEqual({ success: false, error: "This account no longer exists." });
  });

  it("returns the generic error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(updateEditorPreferencesQuery).mockRejectedValue(new Error("db down"));

    const result = await updateEditorPreferences(PREFERENCES);

    expect(result).toEqual({ success: false, error: GENERIC_ERROR });
  });
});
