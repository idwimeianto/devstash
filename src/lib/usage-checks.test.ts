import { beforeEach, describe, expect, it, vi } from "vitest";

import { countUserCollections, countUserItems, getUserPlan } from "@/lib/db/billing";
import {
  checkAiAllowed,
  checkCollectionCreation,
  checkItemCreation,
  checkUploadAllowed,
} from "@/lib/usage-checks";
import {
  AI_PRO_REQUIRED,
  COLLECTION_LIMIT_REACHED,
  ITEM_LIMIT_REACHED,
  PRO_FEATURE_REQUIRED,
} from "@/lib/usage-limits";

vi.mock("@/lib/db/billing", () => ({
  countUserCollections: vi.fn(),
  countUserItems: vi.fn(),
  getUserPlan: vi.fn(),
}));

const USER_ID = "user_1";

function asFree() {
  vi.mocked(getUserPlan).mockResolvedValue({ isPro: false });
}

function asPro() {
  vi.mocked(getUserPlan).mockResolvedValue({ isPro: true });
}

beforeEach(() => {
  vi.stubEnv("PRO_GATING_ENABLED", "true");
  asFree();
  vi.mocked(countUserItems).mockResolvedValue(0);
  vi.mocked(countUserCollections).mockResolvedValue(0);
});

describe("checkAiAllowed", () => {
  it("refuses free users and allows Pro users", async () => {
    expect(await checkAiAllowed(USER_ID)).toBe(AI_PRO_REQUIRED);

    asPro();
    expect(await checkAiAllowed(USER_ID)).toBeNull();
  });

  it("allows everyone without a query while gating is off", async () => {
    vi.stubEnv("PRO_GATING_ENABLED", "false");

    expect(await checkAiAllowed(USER_ID)).toBeNull();
    expect(getUserPlan).not.toHaveBeenCalled();
  });
});

describe("while gating is off", () => {
  beforeEach(() => {
    vi.stubEnv("PRO_GATING_ENABLED", "false");
  });

  it("allows everything without any query", async () => {
    expect(await checkUploadAllowed(USER_ID)).toBeNull();
    expect(await checkItemCreation(USER_ID, "image")).toBeNull();
    expect(await checkCollectionCreation(USER_ID)).toBeNull();
    expect(getUserPlan).not.toHaveBeenCalled();
    expect(countUserItems).not.toHaveBeenCalled();
    expect(countUserCollections).not.toHaveBeenCalled();
  });
});

describe("checkUploadAllowed", () => {
  it("refuses free users", async () => {
    expect(await checkUploadAllowed(USER_ID)).toBe(PRO_FEATURE_REQUIRED);
    expect(getUserPlan).toHaveBeenCalledWith(USER_ID);
  });

  it("allows Pro users", async () => {
    asPro();
    expect(await checkUploadAllowed(USER_ID)).toBeNull();
  });
});

describe("checkItemCreation", () => {
  it("allows a free user's 50th item", async () => {
    vi.mocked(countUserItems).mockResolvedValue(49);

    expect(await checkItemCreation(USER_ID, "snippet")).toBeNull();
    expect(countUserItems).toHaveBeenCalledWith(USER_ID);
  });

  it.each([50, 51])("refuses a free user with %i items", async (count) => {
    vi.mocked(countUserItems).mockResolvedValue(count);

    expect(await checkItemCreation(USER_ID, "snippet")).toBe(ITEM_LIMIT_REACHED);
  });

  it.each(["file", "image"])("refuses a free user's %s item before counting", async (type) => {
    expect(await checkItemCreation(USER_ID, type)).toBe(PRO_FEATURE_REQUIRED);
    expect(countUserItems).not.toHaveBeenCalled();
  });

  it("allows Pro users any type and amount without counting", async () => {
    asPro();

    expect(await checkItemCreation(USER_ID, "image")).toBeNull();
    expect(await checkItemCreation(USER_ID, "snippet")).toBeNull();
    expect(countUserItems).not.toHaveBeenCalled();
  });
});

describe("checkCollectionCreation", () => {
  it("allows a free user's 3rd collection", async () => {
    vi.mocked(countUserCollections).mockResolvedValue(2);

    expect(await checkCollectionCreation(USER_ID)).toBeNull();
    expect(countUserCollections).toHaveBeenCalledWith(USER_ID);
  });

  it.each([3, 4])("refuses a free user with %i collections", async (count) => {
    vi.mocked(countUserCollections).mockResolvedValue(count);

    expect(await checkCollectionCreation(USER_ID)).toBe(COLLECTION_LIMIT_REACHED);
  });

  it("allows Pro users without counting", async () => {
    asPro();

    expect(await checkCollectionCreation(USER_ID)).toBeNull();
    expect(countUserCollections).not.toHaveBeenCalled();
  });
});
