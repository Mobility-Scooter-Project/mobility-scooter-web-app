import { getConnInfo } from "@hono/node-server/conninfo";
import { ENVIRONMENT } from "@shared/config/constants";
import { kv } from "@src/integrations/kv";
import { rateLimiter } from "hono-rate-limiter";
import RedisStore from "rate-limit-redis";

const sharedStore = new RedisStore({
  // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
  sendCommand: (...args: string[]) => kv.call(...args),
});

/**
 * Rate limiter middleware for sign-up requests.
 * Limits the number of sign-up attempts based on IP address to prevent spam and abuse.
 * 
 * @remarks
 * - Window: 8 hours (standard work day)
 * - Limit: 50 sign-ups per window
 * - Key: IP address of the requester
 * - Store: Uses shared store for rate limiting data
 * - Development: Rate limiting is skipped in development environment
 * 
 * @example
 * ```typescript
 * app.post('/signup', signUpRateLimiter, signUpHandler);
 * ```
 */
export const signUpRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 60 * 8, // 8 hours, standard work day
  limit: 50, // 50 sign ups per 8 hours, ex team onboarding throughout the day
  keyGenerator: (c) => {
    const connInfo = getConnInfo(c);
    return `${connInfo.remote.address}`; // base solely on IP address to prevent spamming
  },
  //@ts-expect-error - The store is not defined in the rateLimiter function
  store: sharedStore,
  skip: () => ENVIRONMENT === "development",
});

/**
 * Rate limiter middleware for sign-in attempts.
 * Limits the number of sign-in attempts from a specific email and IP address combination.
 * 
 * @remarks
 * The rate limiter uses a 30-minute window and allows 5 attempts before locking out,
 * matching the standard Windows device lockout policy.
 * 
 * @param c - The context object containing request information
 * @returns A string combining email and IP address as the rate limit key
 * 
 * @throws {Error} When the email is not available in the validated request body
 * 
 * @example
 * ```typescript
 * app.use(signInRateLimiter)
 * ```
 * 
 * @notes
 * - Rate limiting is skipped in development environment
 * - Requires zValidator middleware to be run before this middleware
 * - Uses a shared store for maintaining rate limit counts
 */
export const signInRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 30, // 30 minutes
  limit: 5, // this is the standard lock out rate for Windows devices
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the zValidator middleware
    const { email } = c.req.valid("json");
    const connInfo = getConnInfo(c);
    return `${email}:${connInfo.remote.address}`; // email:
  },
  //@ts-expect-error - The store is not defined in the rateLimiter function
  store: sharedStore,
  skip: () => ENVIRONMENT === "development",
});

/**
 * Rate limiter middleware configuration for OTP (One-Time Password) requests.
 * Limits the number of attempts a user can make within a specified time window.
 * 
 * @remarks
 * The rate limiter is configured with the following parameters:
 * - Time window: 30 minutes
 * - Maximum attempts: 5 per window
 * - Key generation: Combines userId and IP address
 * - Skips rate limiting in development environment
 * 
 * @param c - The context object containing request information
 * @throws {Error} When rate limit is exceeded
 * @requires userId - Expected to be set by a previous middleware
 * @requires sharedStore - External store configuration for rate limiting
 */
export const otpRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 30, // 30 minutes
  limit: 5, // 5 attempts
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the userMiddleware
    const userId = c.get("userId");
    const connInfo = getConnInfo(c);
    return `${userId}:${connInfo.remote.address}`;
  },
  //@ts-expect-error - The store is not defined in the rateLimiter function
  store: sharedStore,
  skip: () => ENVIRONMENT === "development",
});

/**
 * Rate limiter middleware for password reset requests.
 * Limits the number of password reset attempts per email and IP address combination.
 * 
 * @remarks
 * - Allows 3 attempts per 24-hour window
 * - Uses combination of email and IP address as the rate limiting key
 * - Rate limiting is disabled in development environment
 * 
 * @param c - The request context
 * @returns A rate limiter middleware instance
 * 
 * @throws {Error} When rate limit is exceeded
 * 
 * @requires rateLimiter
 * @requires getConnInfo
 * @requires ENVIRONMENT
 * @requires sharedStore
 */
export const resetPasswordRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 60 * 24, // 24 hours
  limit: 3, // 3 attempts
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the zValidator middleware
    const { email } = c.req.valid("json");
    const connInfo = getConnInfo(c);
    return `${email}:${connInfo.remote.address}`;
  },
  //@ts-expect-error - The store is not defined in the rateLimiter function
  store: sharedStore,
  skip: () => ENVIRONMENT === "development",
});
