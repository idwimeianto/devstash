import { beforeEach, describe, expect, it, vi } from "vitest";

import { explainCode, generateAutoTags, generateDescription, optimizePrompt } from "@/actions/ai";
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

describe("model settings", () => {
  const JSON_FORMAT = { type: "json_object" };

  it.each([
    ["generateAutoTags", () => generateAutoTags(INPUT), 500, "low", JSON_FORMAT],
    ["generateDescription", () => generateDescription(INPUT), 500, "low", undefined],
    ["explainCode", () => explainCode({ content: "const a = 1;" }), 1500, "low", undefined],
    ["optimizePrompt", () => optimizePrompt({ content: "fix it" }), 4000, "medium", JSON_FORMAT],
  ])("sends the expected request for %s", async (_name, run, maxTokens, verbosity, format) => {
    await run();

    expect(create.mock.calls[0][0]).toMatchObject({
      model: "gpt-5-nano",
      reasoning: { effort: "minimal" },
      max_output_tokens: maxTokens,
      store: false,
    });
    expect(create.mock.calls[0][0].text.verbosity).toBe(verbosity);
    expect(create.mock.calls[0][0].text.format).toEqual(format);
  });

  it("treats a cut-off reply as a failure even when its JSON parses", async () => {
    create.mockResolvedValue({ status: "incomplete", output_text: '{"tags": ["react"]}' });

    await expect(generateAutoTags(INPUT)).resolves.toMatchObject({ success: false });
    expect(console.error).toHaveBeenCalled();
  });
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

describe("generateDescription", () => {
  const SERVICE_ERROR = "The AI service couldn't write a description right now. Please try again.";

  beforeEach(() => {
    create.mockResolvedValue({ status: "completed", output_text: " A debounce hook.\n" });
  });

  it("returns the cleaned description from plain text, without JSON mode", async () => {
    await expect(generateDescription({ typeName: "snippet", ...INPUT })).resolves.toEqual({
      success: true,
      data: { description: "A debounce hook." },
    });

    const request = create.mock.calls[0][0];
    expect(request.model).toBe("gpt-5-nano");
    expect(request.text.format).toBeUndefined();
    expect(request.input).toContain("<type>snippet</type>");
    expect(request.input).toContain(`<content>${INPUT.content}</content>`);
  });

  it("works from a URL or file name alone", async () => {
    await generateDescription({ url: "https://lucide.dev" });
    await generateDescription({ fileName: "report.pdf" });

    expect(create.mock.calls[0][0].input).toContain("<url>https://lucide.dev</url>");
    expect(create.mock.calls[1][0].input).toContain("<file_name>report.pdf</file_name>");
  });

  it("truncates content to 2000 characters before the call", async () => {
    await generateDescription({ content: `${"a".repeat(2000)}OVERFLOW` });

    expect(create.mock.calls[0][0].input).toContain("a".repeat(2000));
    expect(create.mock.calls[0][0].input).not.toContain("OVERFLOW");
  });

  it("rejects input with nothing to describe without calling the API", async () => {
    await expect(
      generateDescription({ typeName: "snippet", title: "  ", content: "\n", language: "go" }),
    ).resolves.toMatchObject({ success: false, error: "Add a title or content first" });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a too long title without calling the API", async () => {
    await expect(generateDescription({ title: "a".repeat(201) })).resolves.toMatchObject({
      success: false,
      error: "Title must be at most 200 characters",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null as never);

    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("asks free users to upgrade, without using up the rate limit or the API", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue(AI_PRO_REQUIRED);

    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: AI_PRO_REQUIRED,
      upgradeRequired: true,
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("shares the AI rate limit and reports the wait", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 10 * 60_000,
    });

    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please try again in 10 minutes.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1", { failClosed: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("never returns a reply that was cut off", async () => {
    create.mockResolvedValue({ status: "incomplete", output_text: "A debounce hook that" });

    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: SERVICE_ERROR,
    });
  });

  it("reports an AI service error on an empty reply or an API failure", async () => {
    create.mockResolvedValue({ status: "completed", output_text: "" });
    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: SERVICE_ERROR,
    });

    create.mockRejectedValue(new Error("429"));
    await expect(generateDescription(INPUT)).resolves.toEqual({
      success: false,
      error: SERVICE_ERROR,
    });
  });
});

describe("explainCode", () => {
  const SERVICE_ERROR = "The AI service couldn't explain this right now. Please try again.";
  const CODE = { title: "useDebounce", language: "typescript", content: "const a = 1;\n" };

  beforeEach(() => {
    create.mockResolvedValue({ status: "completed", output_text: "\nDeclares `a`.\n\n- A const\n" });
  });

  it("returns the trimmed Markdown from plain text, without JSON mode", async () => {
    await expect(explainCode(CODE)).resolves.toEqual({
      success: true,
      data: { explanation: "Declares `a`.\n\n- A const" },
    });

    const request = create.mock.calls[0][0];
    expect(request.model).toBe("gpt-5-nano");
    expect(request.text.format).toBeUndefined();
    expect(request.store).toBe(false);
    expect(request.input).toContain("<language>typescript</language>");
    expect(request.input).toContain(`<content>${CODE.content}</content>`);
  });

  it("truncates content to 2000 characters before the call", async () => {
    await explainCode({ content: `${"a".repeat(2000)}OVERFLOW` });

    expect(create.mock.calls[0][0].input).toContain("a".repeat(2000));
    expect(create.mock.calls[0][0].input).not.toContain("OVERFLOW");
  });

  it("rejects blank content or a too long title without calling the API", async () => {
    await expect(explainCode({ content: " \n" })).resolves.toMatchObject({
      success: false,
      error: "There's no code to explain",
    });
    await expect(explainCode({ ...CODE, title: "a".repeat(201) })).resolves.toMatchObject({
      success: false,
      error: "Title must be at most 200 characters",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null as never);

    await expect(explainCode(CODE)).resolves.toEqual({ success: false, error: NOT_SIGNED_IN });
    expect(create).not.toHaveBeenCalled();
  });

  it("asks free users to upgrade, without using up the rate limit or the API", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue(AI_PRO_REQUIRED);

    await expect(explainCode(CODE)).resolves.toEqual({
      success: false,
      error: AI_PRO_REQUIRED,
      upgradeRequired: true,
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("shares the AI rate limit and reports the wait", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 10 * 60_000,
    });

    await expect(explainCode(CODE)).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please try again in 10 minutes.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1", { failClosed: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("never returns a reply that was cut off", async () => {
    create.mockResolvedValue({ status: "incomplete", output_text: "Declares" });

    await expect(explainCode(CODE)).resolves.toEqual({ success: false, error: SERVICE_ERROR });
  });

  it("reports an AI service error on an empty reply or an API failure", async () => {
    create.mockResolvedValue({ status: "completed", output_text: "  " });
    await expect(explainCode(CODE)).resolves.toEqual({ success: false, error: SERVICE_ERROR });

    create.mockRejectedValue(new Error("429"));
    await expect(explainCode(CODE)).resolves.toEqual({ success: false, error: SERVICE_ERROR });
  });
});

describe("optimizePrompt", () => {
  const SERVICE_ERROR = "The AI service couldn't optimize this prompt right now. Please try again.";
  const PROMPT = { content: "Review my code {{code}}" };

  beforeEach(() => {
    create.mockResolvedValue({
      output_text: JSON.stringify({
        optimized: "Act as a reviewer. Review {{code}} and list the bugs.",
        changes: ["Added a role"],
      }),
    });
  });

  it("returns the rewrite and its changes, in JSON mode without storing the request", async () => {
    await expect(optimizePrompt(PROMPT)).resolves.toEqual({
      success: true,
      data: {
        optimized: "Act as a reviewer. Review {{code}} and list the bugs.",
        changes: ["Added a role"],
      },
    });

    const request = create.mock.calls[0][0];
    expect(request.model).toBe("gpt-5-nano");
    expect(request.text.format).toEqual({ type: "json_object" });
    expect(request.store).toBe(false);
    expect(request.input).toContain(`<prompt>${PROMPT.content}</prompt>`);
  });

  it("reports when the model kept the prompt as it was", async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({ optimized: PROMPT.content, changes: [] }),
    });

    await expect(optimizePrompt(PROMPT)).resolves.toEqual({
      success: true,
      data: { optimized: null, changes: [] },
    });
  });

  it("sends a prompt at the limit whole and refuses a longer one", async () => {
    await optimizePrompt({ content: "a".repeat(8000) });
    expect(create.mock.calls[0][0].input).toContain("a".repeat(8000));
    create.mockClear();

    await expect(optimizePrompt({ content: "a".repeat(8001) })).resolves.toMatchObject({
      success: false,
      error: "This prompt is too long to optimize (at most 8,000 characters)",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a blank prompt without calling the API", async () => {
    await expect(optimizePrompt({ content: " \n" })).resolves.toMatchObject({
      success: false,
      error: "There's no prompt to optimize",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses when signed out", async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null as never);

    await expect(optimizePrompt(PROMPT)).resolves.toEqual({
      success: false,
      error: NOT_SIGNED_IN,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("asks free users to upgrade, without using up the rate limit or the API", async () => {
    vi.mocked(checkAiAllowed).mockResolvedValue(AI_PRO_REQUIRED);

    await expect(optimizePrompt(PROMPT)).resolves.toEqual({
      success: false,
      error: AI_PRO_REQUIRED,
      upgradeRequired: true,
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("shares the AI rate limit and reports the wait", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 10 * 60_000,
    });

    await expect(optimizePrompt(PROMPT)).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please try again in 10 minutes.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ai", "user_1", { failClosed: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("reports an AI service error on a cut-off reply or an API failure", async () => {
    create.mockResolvedValue({ output_text: '{"optimized": "Act as a rev' });
    await expect(optimizePrompt(PROMPT)).resolves.toEqual({ success: false, error: SERVICE_ERROR });

    create.mockRejectedValue(new Error("429"));
    await expect(optimizePrompt(PROMPT)).resolves.toEqual({ success: false, error: SERVICE_ERROR });
  });
});
