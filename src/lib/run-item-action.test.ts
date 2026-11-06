import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { NETWORK_ERROR } from "@/lib/messages";
import { runItemAction } from "@/lib/run-item-action";
import { showUpgradeToast } from "@/lib/upgrade-toast";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/upgrade-toast", () => ({ showUpgradeToast: vi.fn() }));

const OPTIONS = { successMessage: "Item saved", onFieldErrors: vi.fn() };

describe("runItemAction", () => {
  it("returns the data and shows the success toast", async () => {
    const data = await runItemAction(async () => ({ success: true, data: { id: "item_1" } }), OPTIONS);

    expect(data).toEqual({ id: "item_1" });
    expect(toast.success).toHaveBeenCalledWith("Item saved");
    expect(OPTIONS.onFieldErrors).not.toHaveBeenCalled();
  });

  it("shows no toast on success without a message", async () => {
    const data = await runItemAction(async () => ({ success: true, data: { tags: ["react"] } }));

    expect(data).toEqual({ tags: ["react"] });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("hands back field errors and shows the action's error", async () => {
    const data = await runItemAction(
      async () => ({
        success: false,
        error: "Title is required",
        fieldErrors: { title: ["Title is required"] },
      }),
      OPTIONS,
    );

    expect(data).toBeNull();
    expect(OPTIONS.onFieldErrors).toHaveBeenCalledWith({ title: ["Title is required"] });
    expect(toast.error).toHaveBeenCalledWith("Title is required");
    expect(toast.success).not.toHaveBeenCalled();
    expect(showUpgradeToast).not.toHaveBeenCalled();
  });

  it("shows the upgrade toast instead of the plain error for a free-plan limit", async () => {
    const message = "The free plan includes 3 collections.";
    const data = await runItemAction(
      async () => ({ success: false, error: message, upgradeRequired: true }),
      OPTIONS,
    );

    expect(data).toBeNull();
    expect(showUpgradeToast).toHaveBeenCalledWith(message);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("clears field errors when a failure has none", async () => {
    await runItemAction(async () => ({ success: false, error: "Not found" }), OPTIONS);

    expect(OPTIONS.onFieldErrors).toHaveBeenCalledWith({});
  });

  it("shows the network error when the action can't be reached", async () => {
    const data = await runItemAction(() => Promise.reject(new TypeError("fetch failed")), OPTIONS);

    expect(data).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(NETWORK_ERROR);
    expect(OPTIONS.onFieldErrors).not.toHaveBeenCalled();
  });
});
