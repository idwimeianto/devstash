import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionCanUseAi } from "@/lib/ai-access";
import { getSessionUserId } from "@/lib/db/users";
import { checkAiAllowed } from "@/lib/usage-checks";

vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
vi.mock("@/lib/usage-checks", () => ({ checkAiAllowed: vi.fn() }));

beforeEach(() => {
  vi.mocked(getSessionUserId).mockResolvedValue("user_1");
});

describe("getSessionCanUseAi", () => {
  it("is true when the plan allows AI", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue(null);

    await expect(getSessionCanUseAi()).resolves.toBe(true);
  });

  it("is false when the plan doesn't", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue("Upgrade");

    await expect(getSessionCanUseAi()).resolves.toBe(false);
  });

  it("is false when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null as never);

    await expect(getSessionCanUseAi()).resolves.toBe(false);
    expect(checkAiAllowed).not.toHaveBeenCalled();
  });

  it("is false instead of throwing when the lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(checkAiAllowed).mockRejectedValue(new Error("db down"));

    await expect(getSessionCanUseAi()).resolves.toBe(false);
  });
});
