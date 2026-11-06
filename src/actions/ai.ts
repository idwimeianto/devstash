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
import {
  buildOptimizeInput,
  OPTIMIZE_INSTRUCTIONS,
  parseOptimizedPrompt,
} from "@/lib/ai-optimize";
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
  optimizePromptSchema,
} from "@/lib/validations/ai";
import type {
  ExplainCodeResult,
  GenerateAutoTagsInput,
  GenerateAutoTagsResult,
  GenerateDescriptionResult,
  OptimizePromptResult,
} from "@/types/ai";

const TAGS_SERVICE_ERROR = "The AI service couldn't suggest tags right now. Please try again.";
const DESCRIPTION_SERVICE_ERROR =
  "The AI service couldn't write a description right now. Please try again.";
const EXPLAIN_SERVICE_ERROR = "The AI service couldn't explain this right now. Please try again.";
const OPTIMIZE_SERVICE_ERROR =
  "The AI service couldn't optimize this prompt right now. Please try again.";

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

interface ModelRequest {
  instructions: string;
  input: string;
  maxOutputTokens: number;
  json?: boolean;
  verbosity?: "low" | "medium";
}

// The settings every AI action shares, so cost and data storage can't drift between them.
async function runModel({
  instructions,
  input,
  maxOutputTokens,
  json = false,
  verbosity = "low",
}: ModelRequest): Promise<string> {
  const response = await getOpenAI().responses.create({
    model: AI_MODEL,
    instructions,
    input,
    reasoning: { effort: "minimal" },
    text: json ? { format: { type: "json_object" }, verbosity } : { verbosity },
    max_output_tokens: maxOutputTokens,
    store: false,
  });
  // Plain text can be cut off mid-sentence and still look valid.
  if (response.status === "incomplete") throw new Error("The AI reply was cut off");
  return response.output_text;
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

    const reply = await runModel({
      instructions: AUTO_TAG_INSTRUCTIONS,
      input: buildAutoTagInput(parsed.data.title, parsed.data.content),
      maxOutputTokens: 500,
      json: true,
    });
    return { success: true, data: { tags: parseTagSuggestions(reply) } };
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

    const reply = await runModel({
      instructions: DESCRIPTION_INSTRUCTIONS,
      input: buildDescriptionInput(parsed.data),
      maxOutputTokens: 500,
    });
    return { success: true, data: { description: parseDescription(reply) } };
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

    const reply = await runModel({
      instructions: EXPLAIN_INSTRUCTIONS,
      input: buildExplainInput(parsed.data),
      maxOutputTokens: 1500,
    });
    return { success: true, data: { explanation: parseExplanation(reply) } };
  } catch (error) {
    console.error("Explaining code failed", error);
    return { success: false, error: EXPLAIN_SERVICE_ERROR };
  }
}

// Only suggests: nothing changes until the user accepts, which saves through updateItem.
export async function optimizePrompt(input: { content: string }): Promise<OptimizePromptResult> {
  const parsed = optimizePromptSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  // Always the session's user, never one from the client.
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const refused = await checkAiRequest(userId);
    if (refused) return refused;

    const { content } = parsed.data;
    const reply = await runModel({
      instructions: OPTIMIZE_INSTRUCTIONS,
      input: buildOptimizeInput(content),
      // Room for the longest allowed prompt (about 2,000 tokens) to grow.
      maxOutputTokens: 4000,
      json: true,
      verbosity: "medium",
    });
    return { success: true, data: parseOptimizedPrompt(reply, content) };
  } catch (error) {
    console.error("Optimizing a prompt failed", error);
    return { success: false, error: OPTIMIZE_SERVICE_ERROR };
  }
}
