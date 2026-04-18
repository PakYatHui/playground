import { HttpError } from "./http";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const buckets = new Map<string, RateLimitBucket>();

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip") || "unknown";
}

export function enforcePublicLeadRateLimit(headers: Headers) {
  const ip = getClientIp(headers);
  const now = Date.now();
  const key = `lead:${ip}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpError(
      429,
      "rate_limited",
      "提交过于频繁，请稍后再试。",
    );
  }

  current.count += 1;
}
