"use server";

import { validationFailure } from "@/lib/action-result";
import { AUTO_TAG_INSTRUCTIONS, buildAutoTagInput, parseTagSuggestions } from "@/lib/ai-tags";
import { getSessionUserId } from "@/lib/db/users";
import { NOT_SIGNED_IN } from "@/lib/messages";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rate-limit";
import { checkAiAllowed } from "@/lib/usage-checks";
import { generateAutoTagsSchema } from "@/lib/validations/ai";
import type { GenerateAutoTagsInput, GenerateAutoTagsResult } from "@/types/ai";

const AI_SERVICE_ERROR = "The AI service couldn't suggest tags right now. Please try again.";

export async function generateAutoTags(
  input: GenerateAutoTagsInput,
): Promise<GenerateAutoTagsResult> {
  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const notAllowed = await checkAiAllowed(userId);
    if (notAllowed) return { success: false, error: notAllowed, upgradeRequired: true };

    // Every call costs money, so production refuses when the limit can't be checked.
    const { success, reset } = await checkRateLimit("ai", userId, {
      failClosed: process.env.NODE_ENV === "production",
    });
    if (!success) return { success: false, error: getRateLimitMessage(reset) };

    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: buildAutoTagInput(parsed.data.title, parsed.data.content),
      reasoning: { effort: "minimal" },
      text: { format: { type: "json_object" }, verbosity: "low" },
      max_output_tokens: 500,
      store: false,
    });
    return { success: true, data: { tags: parseTagSuggestions(response.output_text) } };
  } catch (error) {
    console.error("Generating tags failed", error);
    return { success: false, error: AI_SERVICE_ERROR };
  }
}
