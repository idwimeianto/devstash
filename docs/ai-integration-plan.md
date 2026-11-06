# AI Integration Plan — OpenAI `gpt-5-nano`

Research output for `context/research/ai-integration-research.md`. Covers how to add the four Pro AI features (auto-tagging, summaries, code explanation, prompt optimization) to DevStash using OpenAI `gpt-5-nano`, following the patterns the codebase already uses.

> Nothing here is implemented yet. `openai` is not installed and no AI code exists. Pricing and model limits below come partly from third-party sources: check them on OpenAI's pricing page and model docs before relying on them.

---

## Table of Contents

1. [Summary of Recommendations](#1-summary-of-recommendations)
2. [Existing Codebase Patterns to Reuse](#2-existing-codebase-patterns-to-reuse)
3. [OpenAI SDK Setup](#3-openai-sdk-setup)
4. [Model Settings for gpt-5-nano](#4-model-settings-for-gpt-5-nano)
5. [Feature Designs](#5-feature-designs)
6. [Server Action Pattern](#6-server-action-pattern)
7. [Streaming vs Non-Streaming](#7-streaming-vs-non-streaming)
8. [Error Handling](#8-error-handling)
9. [Rate Limiting and Quotas](#9-rate-limiting-and-quotas)
10. [Pro Gating](#10-pro-gating)
11. [Cost Optimization](#11-cost-optimization)
12. [UI Patterns](#12-ui-patterns)
13. [Security](#13-security)
14. [Testing](#14-testing)
15. [Files to Add or Change](#15-files-to-add-or-change)
16. [Suggested Phases](#16-suggested-phases)
17. [Open Questions](#17-open-questions)
18. [Sources](#18-sources)

---

## 1. Summary of Recommendations

| Topic | Recommendation |
| --- | --- |
| SDK | Official `openai` Node SDK, **Responses API** (`client.responses.create` / `.parse`), not Chat Completions. OpenAI recommends Responses for the GPT-5 family. |
| Client | Lazy `getOpenAI()` in `src/lib/openai.ts`, same shape as `getStripe()` in `src/lib/stripe.ts`. Server only. |
| Calls | Four server actions in `src/actions/ai.ts`, one per feature, returning `{ success, data }` or `{ success: false, error, upgradeRequired? }`. |
| Output | Structured output (Zod schema) for tags; plain text for summary, explanation and optimized prompt. |
| Streaming | **Non-streaming for v1**, all four features. Optional later: stream "Explain this code" through a route handler. |
| Persistence | **No migration.** Suggestions are returned, never saved by the AI action. Accepting one saves through the existing `updateItem` action (tags → `tags`, summary → `description`, optimized prompt → `content`). Explanations are display-only. |
| Gating | New `checkAiAllowed(userId)` in `src/lib/usage-checks.ts` using `canUse("ai", plan)`; new `AI_PRO_REQUIRED` message; `upgradeRequired: true` so `runItemAction()` shows the existing upgrade toast. |
| Rate limits | New `ai` entries in `RATE_LIMITS` (per user, hourly and daily). AI should **fail closed** when Upstash is unreachable in production, unlike auth. |
| Cost | `reasoning.effort: "minimal"`, `text.verbosity: "low"`, input truncated to a fixed character budget, `max_output_tokens` per feature, `store: false`. Roughly **$0.0002 per call** at list prices. |
| UI | Suggestion panel with **Accept / Discard** (tags as clickable chips). Spinner + disabled button while pending, error toast, upgrade toast for free users. |

---

## 2. Existing Codebase Patterns to Reuse

| Need | Already in the codebase | Notes |
| --- | --- | --- |
| Signed-in user | `getSessionUserId()` in `src/lib/db/users.ts` | Always the session's user, never one from the client. |
| Item ownership | `getItemDetail(userId, itemId)` in `src/lib/db/items.ts` | `findFirst` on `{ id, userId }`; another user's item looks missing. |
| Plan check | `getUserPlan()` (`src/lib/db/billing.ts`, `cache()`d, from the DB, not the JWT) + `canUse(feature, user)` in `src/lib/usage-limits.ts` | `ProFeature` already includes `"ai"`. |
| Gating switch | `isProGatingEnabled()` | On unless `PRO_GATING_ENABLED === "false"`. Local `.env` has it off, so everyone can use AI in development. |
| Server-side checks | `src/lib/usage-checks.ts` (`checkUploadAllowed`, …) return a message or `null` | Add `checkAiAllowed` in the same style. |
| Action results | `{ success, data }` / `{ success: false, error, fieldErrors?, upgradeRequired? }`, `GENERIC_ERROR` / `NOT_SIGNED_IN` from `src/lib/messages.ts`, `validationFailure()` from `src/lib/action-result.ts` | See `createItem` in `src/actions/items.ts`. |
| Client toasts | `runItemAction()` (`src/lib/run-item-action.ts`) + `showUpgradeToast()` (`src/lib/upgrade-toast.tsx`) | `upgradeRequired: true` already turns into the red "Upgrade" toast linking to `UPGRADE_HREF` (`/upgrade`). |
| Rate limiting | `checkRateLimit(action, identifier)` in `src/lib/rate-limit.ts` (Upstash sliding window, fails open) | Add AI actions to `RATE_LIMITS`. |
| Lazy SDK client + env | `getStripe()` / `requireEnv()` in `src/lib/stripe.ts`, `src/lib/r2.ts` | Same pattern for OpenAI. |
| Tag normalization | `parseTags()` in `src/lib/item-fields.ts`, `ITEM_LIMITS` in `src/lib/validations/items.ts` (50 chars per tag, 20 tags) | Run AI tags through the same rules. |
| Type rules | `isCodeItemType()` (snippet / command), `isMarkdownItemType()` (prompt / note) in `src/lib/item-fields.ts` | Decide which feature appears for which type. |
| Safe rendering | `MarkdownEditor` preview (`react-markdown`, no raw HTML, links through `getSafeHref()`) | Render AI explanations with it. |
| Pro lock in UI | `NewItemButton` computes `canUpload` on the server inside `<Suspense>` and passes it to the client dialog | Same for a `canUseAi` prop. |
| Tests | Vitest, `vi.mock` for Prisma / `@/auth` / Upstash | Mock `@/lib/openai` the same way. |

---

## 3. OpenAI SDK Setup

### Install

```bash
npm install openai
```

**Zod 4 compatibility:** the SDK's `zodTextFormat` helper (`openai/helpers/zod`) is the easiest way to get typed structured output. The project uses `zod` 4.x; check the installed `openai` version's `peerDependencies` for `zod` before using the helper. If it doesn't accept Zod 4, build the format by hand with Zod 4's built-in `z.toJSONSchema(schema)` and validate the reply with `schema.parse()` (shown in [5.1](#51-auto-tagging)).

### Environment

| Variable | Where | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | `.env`, production env | Server only. **Never** `NEXT_PUBLIC_`. |
| `OPENAI_MODEL` (optional) | `.env` | Defaults to `gpt-5-nano`; lets you try another model without a code change. |

### Client (`src/lib/openai.ts`)

```ts
import "server-only"; // check the package is available; otherwise rely on the file never being imported by client code
import OpenAI from "openai";

let client: OpenAI | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Created on first use, like getStripe(), so builds and tests don't need the key.
export function getOpenAI(): OpenAI {
  client ??= new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
    timeout: 20_000, // the SDK default is 10 minutes, far too long for a button click
    maxRetries: 2, // SDK default; retries connection errors, 408, 409, 429 and 5xx with backoff
  });
  return client;
}

export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";
```

Why a 20s timeout: these are interactive requests from a drawer button. With `maxRetries: 2` the worst case is about a minute, so keep the total under the platform's function limit (check Vercel's `maxDuration` for server actions in this Next.js version; server actions run as the page's function).

---

## 4. Model Settings for gpt-5-nano

`gpt-5-nano` is a **reasoning model**. That changes a few defaults compared to older chat models:

| Setting | Value | Why |
| --- | --- | --- |
| `reasoning: { effort: "minimal" }` | All four features | Default is `medium`, which spends hidden reasoning tokens (billed as output) on tasks that don't need them. `minimal` gives few or no reasoning tokens and the lowest latency. Use `"low"` for code explanation only if quality is poor. A third-party test reports `gpt-5-nano` rejects `"none"`; stick to `minimal`. |
| `text: { verbosity: "low" }` | Tags, summary | Keeps answers short without long prompt instructions. `"medium"` for explanations. |
| `max_output_tokens` | Per feature (table in 5) | Caps cost. **Reasoning tokens count toward it**: if it's too small the response ends with `status: "incomplete"` and `incomplete_details.reason: "max_output_tokens"`, possibly with no visible text, and you still pay. Leave headroom (see [8](#8-error-handling)). |
| `temperature`, `top_p` | **Don't send** | GPT-5 reasoning models don't support sampling parameters; control style with `verbosity` and instructions instead. |
| `instructions` | Static system prompt per feature | Fixed text first, so the request prefix is identical across users (helps prompt caching, see [11](#11-cost-optimization)). |
| `store: false` | All calls | Responses are stored by default; we never use `previous_response_id`, so don't keep user content at OpenAI longer than needed. |
| `safety_identifier` | A hash of the user id (e.g. SHA-256) | Lets OpenAI attribute abuse to one end user instead of the whole API key, without sending the email or raw id. Check the parameter name in the current API reference (older docs call it `user`). |

---

## 5. Feature Designs

All four features take an **`itemId`** (not raw content from the client), load the item with `getItemDetail(userId, itemId)` and build the input on the server. This keeps ownership checks in one place and stops a client from using the action as a free general-purpose LLM proxy.

> Exception worth deciding at `start`: suggesting tags / a summary **while creating** an item (no id yet). Option: a second input shape `{ typeName, title, content }`, validated with the same `ITEM_LIMITS`. Recommendation: v1 runs on saved items only (drawer view and edit form), creation later.

| Feature | Item types | Input sent | Output | `max_output_tokens` | Accept saves to |
| --- | --- | --- | --- | --- | --- |
| Auto-tag | All with text (snippet, prompt, command, note, link) | title, type, language, description, content (truncated), URL, existing tags | `{ tags: string[] }` (structured, 1–5) | ~500 | `tags` (merged with existing) |
| Summary | All with text | title, type, content (truncated), URL | 1–2 sentences, plain text | ~500 | `description` |
| Explain code | snippet, command (`isCodeItemType`) | title, language, content (truncated) | Short Markdown explanation | ~1,500 | Nothing (display only, copyable) |
| Optimize prompt | prompt | content (truncated) | `{ optimized: string, changes: string[] }` (structured) | ~2,000 | `content` (replaces) |

File and image items: no AI in v1 (we'd have to download and send the file). Links: tags and summary use the title / URL / description only; **don't fetch the page** (server-side fetch of user URLs is an SSRF risk and adds latency).

### 5.1 Auto-tagging

```ts
// src/lib/ai.ts (sketch)
const tagSuggestionSchema = z.object({
  tags: z.array(z.string()).max(5),
});

export async function suggestTags(item: AiItemInput): Promise<string[]> {
  const response = await getOpenAI().responses.parse({
    model: AI_MODEL,
    reasoning: { effort: "minimal" },
    text: {
      verbosity: "low",
      format: zodTextFormat(tagSuggestionSchema, "tag_suggestions"),
      // without the helper:
      // format: { type: "json_schema", name: "tag_suggestions", strict: true,
      //           schema: z.toJSONSchema(tagSuggestionSchema) },
    },
    instructions: TAG_INSTRUCTIONS,
    input: formatItemForPrompt(item),
    max_output_tokens: 500,
    store: false,
  });
  assertComplete(response); // see section 8
  const parsed = tagSuggestionSchema.parse(response.output_parsed);
  // Same rules as user-typed tags, minus ones the item already has.
  return normalizeSuggestedTags(parsed.tags, item.tags);
}
```

Instruction hints: lowercase, 1–3 words, kebab-case or single words, prefer technology / language / topic names, at most 5, don't repeat existing tags. Passing the **user's existing tag names** (their most-used ones, capped at ~50) makes suggestions consistent with their vocabulary, at the cost of a few hundred input tokens.

Structured-output notes (strict mode): every property must be required and `additionalProperties: false`; optional values are expressed as `nullable`. Keep schemas flat and small.

### 5.2 Summaries

Plain text, one or two sentences, ≤ `ITEM_LIMITS.description` (2,000 chars; trim server-side anyway). Instruction: "Describe what this item is and when to use it. No preamble, no markdown." Accepting fills `description`, which already shows in the drawer, cards and the command palette preview (`toContentPreview()` uses description first).

### 5.3 Explain this code

Markdown output (headings off, short paragraphs and a bullet list), rendered with the existing `MarkdownEditor` read-only preview so no raw HTML or unsafe links get through. Not saved. Optional "Copy" via `CopyButton`. Mention the language from `item.language` (normalized with `getMonacoLanguage()` if helpful).

### 5.4 Prompt optimizer

Structured output so the UI can show **what changed** and offer accept/discard:

```ts
z.object({
  optimized: z.string(),
  changes: z.array(z.string()).max(5), // one-line reasons, e.g. "Added an output format"
});
```

Instruction hints: keep the author's intent and placeholders (`{{var}}`, `<context>`), add role / task / constraints / output format where missing, don't invent facts, return the prompt only (no commentary inside `optimized`). Validate `optimized.length <= ITEM_LIMITS.content`. Show a before/after view; accepting replaces `content` via `updateItem`.

---

## 6. Server Action Pattern

Server actions (not API routes) match the coding standards ("Server Actions for … simple mutations", client components call actions) and the existing item actions. Flow for each AI action:

```
validate input (Zod / typeof)
  → getSessionUserId()                 → NOT_SIGNED_IN
  → checkAiAllowed(userId)             → AI_PRO_REQUIRED, upgradeRequired: true
  → checkRateLimit("ai", userId)       → rate-limit message
  → getItemDetail(userId, itemId)      → NOT_FOUND
  → feature/type check                 → "Not available for this item type"
  → empty content check                → "Add some content first"
  → call OpenAI (src/lib/ai.ts)        → mapped AI errors (section 8)
  → validate + normalize output
  → { success: true, data }
```

```ts
// src/actions/ai.ts (sketch)
"use server";

export async function suggestItemTags(itemId: string): Promise<AiTagsResult> {
  if (typeof itemId !== "string" || !itemId) return { success: false, error: NOT_FOUND };

  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };

  try {
    const notAllowed = await checkAiAllowed(userId);
    if (notAllowed) return { success: false, error: notAllowed, upgradeRequired: true };

    const limited = await checkAiRateLimit(userId);
    if (limited) return { success: false, error: limited };

    const item = await getItemDetail(userId, itemId);
    if (!item) return { success: false, error: NOT_FOUND };
    if (!hasTextForAi(item)) return { success: false, error: NOTHING_TO_ANALYZE };

    const tags = await suggestTags(toAiItemInput(item));
    return { success: true, data: { tags } };
  } catch (error) {
    return aiFailure("Suggesting tags failed", error); // logs and maps, section 8
  }
}
```

Keep the four actions thin: shared steps (auth → gate → rate limit → load item) can live in one private helper, e.g. `loadItemForAi(itemId)`, returning either the item or a failure result, to stay under the 50-line guideline.

**Order matters for cost:** gate and rate-limit before loading or calling anything. Rate-limit *before* the OpenAI call so failed calls still count (otherwise a user could hammer a failing endpoint for free retries).

Result types go in `src/types/ai.ts`, e.g.

```ts
export type AiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; upgradeRequired?: boolean };
```

These fit `runItemAction()` unchanged (it already handles `upgradeRequired`).

---

## 7. Streaming vs Non-Streaming

| | Non-streaming (`responses.create` / `.parse`) | Streaming (`stream: true`, `response.output_text.delta` events) |
| --- | --- | --- |
| Works with server actions | Yes, returns a plain result | Awkward: a server action returns one serialized value; streaming needs a route handler returning a `ReadableStream` (or a library such as the Vercel AI SDK) |
| Structured output | Simple: validate once at the end | Partial JSON until the end; can't validate until done |
| Accept / reject | Natural: the whole suggestion arrives at once | Must wait for the end anyway before "Accept" is enabled |
| Perceived latency | Spinner for the whole call | First words after ~0.5s |
| Error handling | One `try/catch` | Errors can arrive mid-stream (`error` event), plus client abort handling |

**Recommendation:** non-streaming for all four features in v1. With `gpt-5-nano` at `minimal` effort and capped outputs, tags and summaries come back in a few seconds; prompt optimization needs the full result for the before/after diff; tags need validation.

**Later, if explanations feel slow:** add `POST /api/ai/explain` (the coding standards allow API routes for long-running operations) that runs the same auth / gate / rate-limit / ownership checks, calls `getOpenAI().responses.create({ ..., stream: true })` and pipes only `response.output_text.delta` text into a `ReadableStream`; the client reads it with `fetch` + `response.body.getReader()` and an `AbortController` (abort when the drawer closes). Check `node_modules/next/dist/docs/` for route-handler streaming in Next.js 16.4 before building it. The proxy matcher doesn't cover `/api`, so the route must check the session itself (as `GET /api/items/[id]` does).

---

## 8. Error Handling

### What can go wrong

| Case | How it shows up | User message | Log |
| --- | --- | --- | --- |
| Not signed in / not Pro / rate-limited | Our checks | `NOT_SIGNED_IN` / `AI_PRO_REQUIRED` + upgrade toast / "Too many AI requests…" | No |
| Item missing / wrong type / empty | Our checks | "This item doesn't exist…" / "Add some content first" | No |
| OpenAI 429 (our org's rate or quota limit) | `OpenAI.RateLimitError` (after SDK retries) | "AI is busy right now. Please try again in a minute." | Yes, with status |
| OpenAI 503 / overloaded, 5xx | `OpenAI.InternalServerError` / `APIError` with `status >= 500` | Same "busy" message | Yes |
| Timeout / network | `OpenAI.APIConnectionTimeoutError`, `OpenAI.APIConnectionError` | "AI request timed out. Please try again." | Yes |
| Bad key / billing problem | `OpenAI.AuthenticationError` (401), `PermissionDeniedError` (403), 429 with `insufficient_quota` | `GENERIC_ERROR` (don't expose config problems) | Yes, **alert-worthy** |
| Bad request (our bug, e.g. unsupported param) | `OpenAI.BadRequestError` (400) | `GENERIC_ERROR` | Yes |
| Ran out of tokens | `response.status === "incomplete"`, `incomplete_details.reason === "max_output_tokens"` | "The AI response was cut short. Please try again." | Yes (raise the cap) |
| Content filter | `incomplete_details.reason === "content_filter"` | "The AI couldn't process this item." | Yes |
| Refusal (structured output) | A `refusal` content part instead of parsed output; `output_parsed` is `null` | "The AI couldn't process this item." | Yes |
| Malformed output | Our Zod `parse` fails / empty text | `GENERIC_ERROR` | Yes |

### Shape

```ts
// src/lib/ai-errors.ts (sketch)
export class AiResponseError extends Error {
  constructor(public reason: "incomplete" | "filtered" | "refused" | "empty") {
    super(reason);
  }
}

export function assertComplete(response: { status?: string; incomplete_details?: { reason?: string } | null }) {
  if (response.status !== "incomplete") return;
  throw new AiResponseError(
    response.incomplete_details?.reason === "content_filter" ? "filtered" : "incomplete",
  );
}

export function getAiErrorMessage(error: unknown): string {
  if (error instanceof AiResponseError) return AI_RESPONSE_MESSAGES[error.reason];
  if (error instanceof OpenAI.RateLimitError) return AI_BUSY;
  if (error instanceof OpenAI.APIConnectionTimeoutError) return AI_TIMEOUT;
  if (error instanceof OpenAI.APIConnectionError) return AI_TIMEOUT;
  if (error instanceof OpenAI.APIError && (error.status ?? 0) >= 500) return AI_BUSY;
  return GENERIC_ERROR;
}
```

Notes:

- The SDK already retries 429 / 5xx / connection errors twice with exponential backoff (honouring `retry-after`). Don't add a second retry loop in the action; the user's "Try again" button is the outer retry.
- Log `error.status`, `error.requestID` (the SDK exposes the `x-request-id`) and the feature name, **not** the item content.
- Check `instanceof OpenAI.APIConnectionTimeoutError` before `APIConnectionError` (it's a subclass) if you want different messages; here they share one.

---

## 9. Rate Limiting and Quotas

Two separate problems:

1. **Abuse / runaway cost from one user** → our Upstash limiter, per user id.
2. **OpenAI's own limits on our org** (requests and tokens per minute, by usage tier) → handled by SDK retries + the "busy" message; raise the tier as usage grows.

### Proposed limits

Add to `RATE_LIMITS` in `src/lib/rate-limit.ts` (one shared bucket for all four features keeps it simple):

| Key | Limit | Identifier | Purpose |
| --- | --- | --- | --- |
| `ai` | 30 / 1 h | `userId` | Burst protection (double clicks, scripts) |
| `aiDaily` | 200 / 24 h | `userId` | Hard daily cap per user (cost ceiling: ~200 × $0.0002 ≈ $0.04 / user / day) |

Numbers are starting points; tune after looking at real usage. Check both in a small `checkAiRateLimit(userId)` helper and return `getRateLimitMessage(reset)`-style text ("Too many AI requests. Please try again in X minutes.").

### Fail closed for AI

`checkRateLimit()` **fails open** on purpose (auth must keep working when Upstash is down). For AI, failing open means unlimited paid calls during an outage or when the env variables are missing in production. Options:

- Add an option, e.g. `checkRateLimit("ai", userId, { failClosed: true })`, that returns `success: false` when Upstash isn't configured **in production** or the check throws; keep failing open in development so local work doesn't need Upstash.
- Also set a **monthly budget / usage limit in the OpenAI dashboard** (project-level limits) as a last line of defence.

### Client-side

Disable the button while a request is pending (prevents double submits) and don't auto-trigger AI on typing or on drawer open; every call is a deliberate click.

---

## 10. Pro Gating

Matches the existing upload gating:

```ts
// src/lib/usage-limits.ts
export const AI_PRO_REQUIRED = "AI features are a Pro feature. Upgrade to Pro to use them.";

// src/lib/usage-checks.ts
export async function checkAiAllowed(userId: string): Promise<string | null> {
  if (!isProGatingEnabled()) return null;
  return canUse("ai", await getUserPlan(userId)) ? null : AI_PRO_REQUIRED;
}
```

- `PRO_FEATURE_REQUIRED` mentions uploads specifically, so AI needs its own message.
- The plan comes from the database (`getUserPlan`), never from `session.user.isPro` (JWT) and never from a client flag.
- While `PRO_GATING_ENABLED=false` (local `.env`) everyone can use AI, as the project overview asks during development. In production gating is on by default.
- **Rate limits still apply when gating is off**: gating decides *who* may use AI, rate limits cap *how much*.

### UI side

- Server component computes `canUseAi` with `checkAiAllowed(userId) === null` inside `<Suspense>` (like `NewItemButton`'s `canUpload`) and passes it down to the drawer.
- Free users still see the AI buttons with a small lock icon / `ProBadge`; clicking opens the upgrade path (`UPGRADE_HREF`) instead of calling the action. Showing the locked feature is better for conversion than hiding it.
- The server check remains the real enforcement; if the UI is stale (user just downgraded), the action returns `upgradeRequired: true` and `runItemAction()` shows the existing red upgrade toast.

---

## 11. Cost Optimization

### Price check

Third-party aggregators list `gpt-5-nano` at **$0.05 / 1M input tokens, $0.40 / 1M output tokens**, cached input $0.005 / 1M, Batch at half price. Context window figures differ between sources (128K–400K); we only send a few thousand tokens, so it doesn't matter here. **Verify on OpenAI's pricing page.**

### Rough per-call cost

| Feature | Input tokens (est.) | Output incl. reasoning (est.) | Cost per call |
| --- | --- | --- | --- |
| Tags | ~1,500 | ~150 | ≈ $0.00014 |
| Summary | ~1,500 | ~120 | ≈ $0.00012 |
| Explain code | ~2,000 | ~600 | ≈ $0.00034 |
| Optimize prompt | ~1,500 | ~900 | ≈ $0.00044 |

A heavy Pro user making 500 calls a month costs roughly $0.10–0.25, against $8 revenue. Cost is not the main risk; abuse without limits is.

### Levers (in order of impact)

1. **`reasoning.effort: "minimal"`**: reasoning tokens are billed as output at 8× the input price; `medium` (the default) can multiply output cost several times over.
2. **Truncate input** on the server: e.g. `AI_INPUT_CHAR_LIMIT = 8_000` characters of content (~2K tokens) plus title / description. Items can hold 100,000 characters (`ITEM_LIMITS.content`). Cut at a line boundary and tell the model it's truncated. Prompt optimization may need more (prompts can be long); use a larger limit there or refuse very long prompts with a clear message.
3. **`max_output_tokens`** per feature (section 5), with headroom so `minimal` reasoning doesn't hit it.
4. **`text.verbosity: "low"`** and short, explicit format instructions ("at most 5 tags", "1–2 sentences").
5. **Only on click**, never automatic (no "suggest tags as you type").
6. **Prompt caching** is automatic for prompts ≥ 1,024 tokens with an identical prefix. Our instructions are short, so savings are small; still put static instructions first and the item content last.
7. **Optional result cache**: hash `feature + model + normalized input` (SHA-256) and keep the result in Upstash Redis for ~24 h. Saves money when users click "Regenerate" on unchanged content… but then "Regenerate" returns the same answer, so skip the cache when the user explicitly regenerates. Defer until usage justifies it.
8. **Batch API** (50% off) only fits offline jobs, e.g. backfilling summaries for existing items. Not for interactive buttons.
9. **Track usage**: log `response.usage` (`input_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`) per feature, without content, so caps and limits can be tuned. A DB table for per-user usage is optional and would need a migration; logs are enough for v1.

---

## 12. UI Patterns

### Where the buttons live

| Place | Features | Why |
| --- | --- | --- |
| Drawer **view mode** (`ItemDetailView` action bar, e.g. a "Sparkles" AI menu on shadcn `dropdown-menu`) | Explain code, Summarize, Suggest tags, Optimize prompt | Most discoverable; explanation is read-only anyway |
| Drawer **edit form** (`ItemEditForm` / `ItemFormFields`) | "Suggest" next to Tags, "Generate" next to Description, "Optimize" above prompt content | Suggestions go into **form state**; the user saves with the existing Save button, so no extra persistence logic |

Recommendation: **start with the edit form** for tags / summary / optimize (accepting just fills fields, saving uses the normal `updateItem` path with its validation, toasts and `router.refresh()`), and **view mode** for Explain code. The AI actions need a saved item id, which the edit form has.

### States

- **Idle**: ghost button with `Sparkles` icon and label ("Suggest tags"). Locked variant for free users (lock icon / `ProBadge`, links to `UPGRADE_HREF`).
- **Pending**: button disabled with a spinner (same as Save / Create), `aria-busy`, optional skeleton lines where the result will appear. Use `useTransition` or local state; keep other fields editable.
- **Error**: toast through `runItemAction()` (network error, action error, upgrade toast); the button returns to idle so the user can retry.
- **Result**: an inline **suggestion panel** (bordered, subtle `Sparkles` header "AI suggestion"):
  - **Tags**: each suggested tag as a clickable chip ("+ react"), plus "Add all" and "Dismiss". Already-present tags are filtered out server-side.
  - **Summary**: the text with **Accept** (writes into Description field) / **Regenerate** / **Discard**.
  - **Optimized prompt**: before/after (two tabs or stacked, `MarkdownEditor` preview), the `changes` list as bullets, **Replace content** / **Discard**.
  - **Explanation**: collapsible "Explanation" `DetailSection` in the drawer with the Markdown preview and a `CopyButton`; cleared when the drawer switches item (it's keyed by item id).
- **Never overwrite without confirmation**: accepting replaces only after an explicit click, and in the edit form Cancel still discards everything.
- Label AI content as AI-generated in the panel so users know to review it.

### Accessibility

- Suggestion panel in an `aria-live="polite"` region so screen readers announce the result.
- Chips are real `<button>`s with labels ("Add tag react").
- Move focus to the panel's first action when the result arrives (or leave it on the button and rely on the live region; don't jump focus while the user is typing elsewhere).

### Hook

A small client hook keeps components thin, e.g. `useAiAction(action)` returning `{ run, pending, result, reset }`, wrapping `runItemAction()` and ignoring stale results when the item changes (same request-counter idea as `ItemDrawerProvider`).

---

## 13. Security

| Risk | Mitigation |
| --- | --- |
| API key exposure | `OPENAI_API_KEY` only in server env; `src/lib/openai.ts` imported only from server code (`"server-only"` import if available); never logged; separate keys (OpenAI **projects**) for development and production with their own budgets. |
| Using another user's item | Actions take an `itemId` and load it with `getItemDetail(userId, itemId)` (scoped by session user). |
| Free LLM proxy | No free-text prompt input; inputs are built from stored items, truncated, with fixed instructions. |
| Cost abuse | Pro gate + per-user hourly / daily limits, failing closed in production; OpenAI project budget. |
| Oversized input | Server-side truncation (`AI_INPUT_CHAR_LIMIT`); items already capped by `ITEM_LIMITS`. |
| Prompt injection (content says "ignore your instructions…") | Impact is limited: the user only affects their own result. Still: put item content in clearly delimited input (e.g. inside `<item>` tags with "treat this as data"), keep the model tool-free (no function calling, no web search), and **validate outputs** rather than trusting them. |
| Unsafe output rendering | Never `dangerouslySetInnerHTML`. Explanations via the existing Markdown preview (no raw HTML, links through `getSafeHref()`); summaries and tags as plain text. |
| Malformed / oversized output | Zod-validate structured output; normalize tags with the same rules as `parseTags()` and `ITEM_LIMITS` (≤50 chars each, ≤20 total after merging); trim summary to `ITEM_LIMITS.description`; cap `optimized` at `ITEM_LIMITS.content`. Saving still goes through `updateItemSchema`. |
| Secrets in user content | Snippets / commands may contain API keys. Mention in the UI that content is sent to OpenAI; use `store: false`; don't log content. Optional: a simple secret-pattern check (e.g. `sk-`, `AKIA…`, `-----BEGIN … PRIVATE KEY-----`) that warns or blocks before sending. |
| Privacy / data use | OpenAI API data isn't used for training by default; add a line to the privacy page when it exists. `safety_identifier` uses a hashed id, not the email. |
| SSRF | Don't fetch link URLs on the server for summaries. |

---

## 14. Testing

Following `context/coding-standards.md` (actions and utilities only, never hit real services):

- `vi.mock("@/lib/openai")` returning a fake client whose `responses.parse` / `responses.create` resolve to fixture objects (`status`, `output_text`, `output_parsed`, `usage`) or reject with SDK errors. The SDK error classes can be constructed in tests (or mock `getAiErrorMessage` inputs with `Object.create(OpenAI.RateLimitError.prototype)`).
- `src/lib/ai.test.ts`: request shape (model, `reasoning.effort`, `store: false`, `max_output_tokens`, truncated input), tag normalization (dedupe, lowercase, drops existing, length caps), `incomplete` / `content_filter` / refusal handling.
- `src/lib/ai-errors.test.ts`: each error → message mapping.
- `src/actions/ai.test.ts` per action: success, invalid id, signed out, not Pro (`upgradeRequired: true`), rate-limited, item not found (another user's), wrong item type, empty content, OpenAI failure → mapped message, and that OpenAI is **not called** when any earlier check fails.
- `src/lib/usage-checks.test.ts`: `checkAiAllowed` with gating off / free / Pro.
- `src/lib/rate-limit.test.ts`: the new fail-closed behaviour (production without Upstash → denied; development → allowed).

Manual checks: one real call per feature on the dev key, the locked state with `PRO_GATING_ENABLED=true` and a free user, and a rate-limit hit with Upstash configured.

---

## 15. Files to Add or Change

| File | Change |
| --- | --- |
| `package.json` | Add `openai` |
| `src/lib/openai.ts` | New: `getOpenAI()`, `AI_MODEL` |
| `src/lib/ai.ts` | New: `suggestTags`, `summarizeItem`, `explainCode`, `optimizePrompt`, instructions, input formatting / truncation, output normalization |
| `src/lib/ai-errors.ts` | New: `AiResponseError`, `assertComplete`, `getAiErrorMessage`, messages |
| `src/actions/ai.ts` | New: `suggestItemTags`, `generateItemSummary`, `explainItemCode`, `optimizeItemPrompt` |
| `src/types/ai.ts` | New: result types |
| `src/lib/usage-limits.ts` | Add `AI_PRO_REQUIRED` |
| `src/lib/usage-checks.ts` | Add `checkAiAllowed` |
| `src/lib/rate-limit.ts` | Add `ai` / `aiDaily` limits, fail-closed option |
| `src/hooks/use-ai-action.ts` | New client hook |
| `src/components/ai/*` | New: `AiButton` (idle / pending / locked), `TagSuggestions`, `SummarySuggestion`, `PromptSuggestion`, `CodeExplanation` |
| `src/components/items/ItemFormFields.tsx`, `ItemEditForm.tsx`, `ItemDetailView.tsx`, `ItemDrawer.tsx` | Wire in the buttons / panels and the `canUseAi` prop |
| Server component that renders the drawer data | Compute `canUseAi` in `<Suspense>` |
| `.env` / production env | `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) |
| Tests | As in section 14 |

No Prisma migration is required for v1.

---

## 16. Suggested Phases

1. **AI Phase 1 — Infrastructure + Auto-tagging**: SDK, client, error mapping, gating, rate limits (fail closed), `suggestItemTags` action, tag chips in the edit form, tests.
2. **AI Phase 2 — Summaries + Explain code**: `generateItemSummary` (fills Description in the edit form), `explainItemCode` (view mode panel with Markdown preview).
3. **AI Phase 3 — Prompt optimizer**: structured `{ optimized, changes }`, before/after panel, replace content.
4. **Later / optional**: AI on the New Item dialog (no id yet), streaming explanations via a route handler, result cache in Redis, per-user usage table, secret-pattern warning.

---

## 17. Open Questions

- Should AI work in the New Item dialog before the item is saved? (Needs a content-based input instead of `itemId`.)
- Do summaries **replace** the description, or only fill it when empty (and otherwise ask)?
- Rate limit numbers (hourly / daily) and whether to show remaining uses in the UI.
- Should free users get a small number of trial AI calls, or none?
- Warn or block when content looks like it contains secrets?
- Keep `gpt-5-nano` for explanations, or allow `gpt-5-mini` for that one feature if quality is too low (`OPENAI_MODEL` per feature)?

---

## 18. Sources

- OpenAI API docs via Context7 (`/websites/developers_openai_api`): Structured Outputs guide (`responses.parse`, `zodTextFormat`, incomplete / refusal handling), Reasoning guide (`max_output_tokens`, incomplete responses, reasoning tokens), Streaming Responses guide (`response.output_text.delta`, `response.completed`, `error` events), Error codes guide (`APIConnectionError`, `RateLimitError`, `APIError`), Rate limits guide (429 / 503 handling), Flex processing guide (default 10-minute SDK timeout, automatic retries).
- [OpenAI Cookbook — GPT-5 New Params and Tools](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_new_params_and_tools) (`reasoning.effort: "minimal"`, `text.verbosity`, Responses API recommended)
- [benjamincrozat.com — GPT-5 nano API](https://benjamincrozat.com/gpt-5-nano-api) (third-party: `minimal` as the lowest accepted effort for `gpt-5-nano`)
- Pricing (third-party, verify on OpenAI's pricing page): [pricepertoken.com](https://pricepertoken.com/pricing-page/model/openai-gpt-5-nano), [anotherwrapper.com](https://anotherwrapper.com/tools/llm-pricing/gpt-5-nano-2025-08-07), [cloudprice.net](https://cloudprice.net/models/gpt-5-nano)
- Codebase: `src/actions/items.ts`, `src/lib/usage-limits.ts`, `src/lib/usage-checks.ts`, `src/lib/rate-limit.ts`, `src/lib/db/billing.ts`, `src/lib/stripe.ts`, `context/coding-standards.md`, `context/current-feature.md` history (upload gating, upgrade toast, `runItemAction`, Markdown preview, `ITEM_LIMITS`)
