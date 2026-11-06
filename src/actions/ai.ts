"use server";

import { validationFailure } from "@/lib/action-result";
import {
  buildDescriptionInput,
  DESCRIPTION_INSTRUCTIONS,
  parseDescription,
  type DescriptionSource,
} from "@/lib/ai-description";
import {
  buildExplainInput,
  EXPLAIN_INSTRUCTIONS,
  parseExplanation,
  type ExplainSource,
} from "@/lib/ai-explain";
import { AUTO_TAG_INSTRUCTIONS, buildAutoTagInput, parseTagSuggestions } from "@/lib/ai-tags";
import { getSessionUserId } from "@/lib/db/users";
import { NOT_SIGNED_IN } from "@/lib/messages";
import { AI_MODEL, getOpenAI } from "@/lib/openai";
import { checkRateLimit, getRateLimitMessage } from "@/lib/rate-limit";
import { checkAiAllowed } from "@/lib/usage-checks";
import {
  explainCodeSchema,
  generateAutoTagsSchema,
  generateDescriptionSchema,
} from "@/lib/validations/ai";
import type {
  ExplainCodeResult,
  GenerateAutoTagsInput,
  GenerateAutoTagsResult,
  GenerateDescriptionResult,
} from "@/types/ai";

const TAGS_SERVICE_ERROR = "The AI service couldn't suggest tags right now. Please try again.";
const DESCRIPTION_SERVICE_ERROR =
  "The AI service couldn't write a description right now. Please try again.";
const EXPLAIN_SERVICE_ERROR = "The AI service couldn't explain this right now. Please try again.";

// The plan and the shared hourly limit. Returns the failure to send back, or null when allowed.
async function checkAiRequest(userId: string) {
  const notAllowed = await checkAiAllowed(userId);
  if (notAllowed) return { success: false as const, error: notAllowed, upgradeRequired: true };

  // Every call costs money, so production refuses when the limit can't be checked.
  const { success, reset } = await checkRateLimit("ai", userId, {
    failClosed: process.env.NODE_ENV === "production",
  });
  return success ? null : { success: false as const, error: getRateLimitMessage(reset) };
}

export async function generateAutoTags(
  input: GenerateAutoTagsInput,
): Promise<GenerateAutoTagsResult> {
  const parsed = generateAutoTagsSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const refused = await checkAiRequest(userId);
    if (refused) return refused;

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
    return { success: false, error: TAGS_SERVICE_ERROR };
  }
}

export async function generateDescription(
  input: DescriptionSource,
): Promise<GenerateDescriptionResult> {
  const parsed = generateDescriptionSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const refused = await checkAiRequest(userId);
    if (refused) return refused;

    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: DESCRIPTION_INSTRUCTIONS,
      input: buildDescriptionInput(parsed.data),
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      max_output_tokens: 500,
      store: false,
    });
    // Plain text can be cut off mid-sentence and still look valid.
    if (response.status === "incomplete") throw new Error("The AI reply was cut off");
    return { success: true, data: { description: parseDescription(response.output_text) } };
  } catch (error) {
    console.error("Generating a description failed", error);
    return { success: false, error: DESCRIPTION_SERVICE_ERROR };
  }
}

export async function explainCode(input: ExplainSource): Promise<ExplainCodeResult> {
  const parsed = explainCodeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const refused = await checkAiRequest(userId);
    if (refused) return refused;

    const response = await getOpenAI().responses.create({
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input: buildExplainInput(parsed.data),
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      max_output_tokens: 1500,
      store: false,
    });
    // Plain text can be cut off mid-sentence and still look valid.
    if (response.status === "incomplete") throw new Error("The AI reply was cut off");
    return { success: true, data: { explanation: parseExplanation(response.output_text) } };
  } catch (error) {
    console.error("Explaining code failed", error);
    return { success: false, error: EXPLAIN_SERVICE_ERROR };
  }
}
