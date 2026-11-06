import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

// Created on first use so builds and tests don't need the env.
let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  // The SDK's default timeout is 10 minutes, far too long for someone waiting on a button.
  client ??= new OpenAI({ apiKey, timeout: 20_000 });
  return client;
}
