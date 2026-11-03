import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCollection } from "@/actions/collections";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";
import { getSessionUserId } from "@/lib/db/users";
import { GENERIC_ERROR, NOT_SIGNED_IN } from "@/lib/messages";

vi.mock("@/lib/db/collections", () => ({ createCollection: vi.fn() }));
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
