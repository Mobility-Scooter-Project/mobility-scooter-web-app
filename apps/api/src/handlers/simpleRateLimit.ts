import { Context } from "hono";

type Entry = { count: number; start: number };
const rateMap = new Map<string, Entry>();

/**
 * Very small in-memory rate limiter for dev/testing.
 * Not suitable for multi-instance production.
 */
export function simpleRateLimit(limit = 20, windowMs = 60_000) {
  return async (c: Context, next: () => Promise<Response>) => {
    // Try common headers for client IP
    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      c.req.header("cf-connecting-ip") ||
      "unknown";

    const now = Date.now();
    const entry = rateMap.get(ip) ?? { count: 0, start: now };

    if (now - entry.start > windowMs) {
      entry.start = now;
      entry.count = 0;
    }

    entry.count += 1;
    rateMap.set(ip, entry);

    if (entry.count > limit) {
      return new Response(JSON.stringify({ message: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  };
}
