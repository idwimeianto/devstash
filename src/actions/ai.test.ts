import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateAutoTags } from "@/actions/ai";
import { getSessionUserId } from "@/lib/db/users";
import { NOT_SIGNED_IN } from "@/lib/messages";
import { getOpenAI } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkAiAllowed } from "@/lib/usage-checks";
import { AI_PRO_REQUIRED } from "@/lib/usage-limits";

vi.mock("@/lib/db/users", () => ({ getSessionUserId: vi.fn() }));
vi.mock("@/lib/usage-checks", () => ({ checkAiAllowed: vi.fn() }));
vi.mock("@/lib/openai", () => ({ AI_MODEL: "gpt-5-nano", getOpenAI: vi.fn() }));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  checkRateLimit: vi.fn(),
}));

const INPUT = { title: "useDebounce", content: "export function useDebounce() {}" };
const create = vi.fn();

beforeEach(() => {
  vi.mocked(getSessionUserId).mockResolvedValue("user_1");
  vi.mocked(checkAiAllowed).mockResolvedValue(null);
  vi.mocked(checkRateLimit).mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  create.mockResolvedValue({ output_text: '{"tags": ["React", "hooks"]}' });
  vi.mocked(getOpenAI).mockReturnValue({ responses: { create } } as never);
  // The action logs failures it reports to the user.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("generateAutoTags", () => {
  it("returns normalized tags from the Responses API", async () => {
    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: true,
      data: { tags: ["react", "hooks"] },
    });

    const request = create.mock.calls[0][0];
    expect(request.model).toBe("gpt-5-nano");
    expect(request.text.format).toEqual({ type: "json_object" });
    expect(request.input).toContain(INPUT.title);
    expect(request.input).toContain(INPUT.content);
  });

  it("handles a bare array reply", async () => {
    create.mockResolvedValue({ output_text: '["react"]' });

    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: true,
      data: { tags: ["react"] },
    });
  });

  it("truncates content to 2000 characters before the call", async () => {
    await generateAutoTags({ title: "Long", content: `${"a".repeat(2000)}OVERFLOW` });

    expect(create.mock.calls[0][0].input).toContain("a".repeat(2000));
    expect(create.mock.calls[0][0].input).not.toContain("OVERFLOW");
  });

  it("works without content", async () => {
    const result = await generateAutoTags({ title: "Docker Docs" });

    expect(result.success).toBe(true);
  });

  it("rejects a blank or too long title without calling the API", async () => {
    await expect(generateAutoTags({ title: "   " })).resolves.toMatchObject({
      success: false,
      error: "Add a title first",
    });
    await expect(generateAutoTags({ title: "a".repeat(201) })).resolves.toMatchObject({
      success: false,
      error: "Title must be at most 200 characters",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null as never);

    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("asks free users to upgrade, without using up the rate limit or the API", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue(AI_PRO_REQUIRED);

    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: AI_PRO_REQUIRED,
      upgradeRequired: true,
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("limits per user and reports the wait when the limit is reached", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 10 * 60_000,
    });

    const result = await generateAutoTags(INPUT);

    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1", { failClosed: false });
    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 10 minutes.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("fails closed on the rate limit in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await generateAutoTags(INPUT);

    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1", { failClosed: true });
  });

  it("reports an AI service error when the API fails", async () => {
    create.mockRejectedValue(new Error("429"));

    await expect(generateAutoTags(INPUT)).resolves.toEqual({
      success: false,
      error: "The AI service couldn't suggest tags right now. Please try again.",
    });
  });

  it("reports an AI service error on an unusable reply", async () => {
    create.mockResolvedValue({ output_text: "" });

    await expect(generateAutoTags(INPUT)).resolves.toMatchObject({ success: false });
  });

  it("reports an AI service error when the key is missing", async () => {
    vi.mocked(getOpenAI).mockImplementation(() => {
      throw new Error("OPENAI_API_KEY is not set");
    });

    await expect(generateAutoTags(INPUT)).resolves.toMatchObject({ success: false });
  });
});
