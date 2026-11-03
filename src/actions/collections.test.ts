import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCollection,
  deleteCollection,
  getCollectionOptions,
  updateCollection,
} from "@/actions/collections";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";

vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getCollectionOptions: vi.fn(),
  updateCollection: vi.fn(),
}));

const NOT_FOUND = "This collection doesn't exist or was deleted.";
vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));

const USER_ID = "user_1";
const CREATED = { id: "c1", name: "React Patterns", description: null };

describe("createCollection action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(createCollectionQuery).mockResolvedValue(CREATED);
  });

  it("creates the collection for the session user with the validated input", async () => {
    const result = await createCollection({ name: "  React Patterns  ", description: "" });

    expect(result).toEqual({ success: true, data: CREATED });
    expect(createCollectionQuery).toHaveBeenCalledWith(USER_ID, {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns field errors for invalid input without touching the database", async () => {
    const result = await createCollection({ name: "" });

    expect(result).toEqual({
      success: false,
      error: "Name is required",
      fieldErrors: { name: ["Name is required"] },
    });
    expect(getSessionUserId).not.toHaveBeenCalled();
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: NOT_SIGNED_IN });
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(createCollectionQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: GENERIC_ERROR });
  });
});

describe("updateCollection action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(updateCollectionQuery).mockResolvedValue(CREATED);
  });

  it("updates the session user's collection with the validated input", async () => {
    const result = await updateCollection("c1", { name: " React Patterns ", description: "  " });

    expect(result).toEqual({ success: true, data: CREATED });
    expect(updateCollectionQuery).toHaveBeenCalledWith(USER_ID, "c1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns field errors for invalid input without touching the database", async () => {
    const result = await updateCollection("c1", { name: "x".repeat(101) });

    expect(result).toMatchObject({
      success: false,
      fieldErrors: { name: ["Name must be at most 100 characters"] },
    });
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("treats an empty id as not found without touching the database", async () => {
    await expect(updateCollection("", { name: "Hooks" })).resolves.toEqual({
      success: false,
      error: NOT_FOUND,
    });
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    await expect(updateCollection("c1", { name: "Hooks" })).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("reports a missing or another user's collection as not found", async () => {
    vi.mocked(updateCollectionQuery).mockResolvedValue(null);

    await expect(updateCollection("c9", { name: "Hooks" })).resolves.toEqual({
      success: false,
      error: NOT_FOUND,
    });
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(updateCollectionQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(updateCollection("c1", { name: "Hooks" })).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});

describe("deleteCollection action", () => {
  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(deleteCollectionQuery).mockResolvedValue(true);
  });

  it("deletes the session user's collection", async () => {
    await expect(deleteCollection("c1")).resolves.toEqual({ success: true });
    expect(deleteCollectionQuery).toHaveBeenCalledWith(USER_ID, "c1");
  });

  it("treats an empty id as not found without touching the database", async () => {
    await expect(deleteCollection("")).resolves.toEqual({ success: false, error: NOT_FOUND });
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    await expect(deleteCollection("c1")).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("reports a missing or another user's collection as not found", async () => {
    vi.mocked(deleteCollectionQuery).mockResolvedValue(false);

    await expect(deleteCollection("c9")).resolves.toEqual({ success: false, error: NOT_FOUND });
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(deleteCollectionQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(deleteCollection("c1")).resolves.toEqual({
      success: false,
      error: GENERIC_ERROR,
    });
  });
});

describe("getCollectionOptions action", () => {
  const OPTIONS = [{ id: "c1", name: "React Patterns" }];

  beforeEach(() => {
    vi.mocked(getSessionUserId).mockResolvedValue(USER_ID);
    vi.mocked(getCollectionOptionsQuery).mockResolvedValue(OPTIONS);
  });

  it("returns the session user's collections", async () => {
    await expect(getCollectionOptions()).resolves.toEqual({ success: true, data: OPTIONS });
    expect(getCollectionOptionsQuery).toHaveBeenCalledWith(USER_ID);
  });

  it("rejects a signed-out user", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    await expect(getCollectionOptions()).resolves.toEqual({ success: false, error: NOT_SIGNED_IN });
    expect(getCollectionOptionsQuery).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database fails", async () => {
    vi.mocked(getCollectionOptionsQuery).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(getCollectionOptions()).resolves.toEqual({ success: false, error: GENERIC_ERROR });
  });
});
