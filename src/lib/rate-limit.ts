import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMITS = {
  login: { requests: 5, window: "15 m" },
  register: { requests: 3, window: "1 h" },
  forgotPassword: { requests: 3, window: "1 h" },
  resetPassword: { requests: 5, window: "15 m" },
  resendVerification: { requests: 3, window: "15 m" },
} satisfies Record<string, { requests: number; window: Duration }>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  // Unix time in milliseconds when the window frees up again.
  reset: number;
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const limiters = new Map<RateLimitAction, Ratelimit>();

function getLimiter(action: RateLimitAction) {
  if (!redis) return null;

  let limiter = limiters.get(action);
  if (!limiter) {
    const { requests, window } = RATE_LIMITS[action];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `devstash:ratelimit:${action}`,
    });
    limiters.set(action, limiter);
  }
  return limiter;
}

// Fails open: auth keeps working when Upstash is unreachable or not configured.
export async function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const allowed = { success: true, remaining: RATE_LIMITS[action].requests, reset: 0 };
  const limiter = getLimiter(action);
  if (!limiter) return allowed;

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check failed for ${action}`, error);
    return allowed;
  }
}

// The first x-forwarded-for entry is the client on Vercel, which sets the header itself.
export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip") || "unknown";
}

export function getRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function getRateLimitMessage(reset: number) {
  const minutes = Math.ceil(getRetryAfterSeconds(reset) / 60);
  return `Too many attempts. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
