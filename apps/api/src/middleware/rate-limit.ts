import { getConnInfo } from "@hono/node-server/conninfo";
import { ENVIRONMENT } from "@src/config/constants";
import container, { KVSymbol } from "@src/lib/container";
import { rateLimiter } from "hono-rate-limiter";
import type { RateLimiterMiddleware, Store } from "hono-rate-limiter";
import type { MiddlewareHandler } from "hono";
import type Redis from "ioredis";
import RedisStore from "rate-limit-redis";

let sharedStore: Store | undefined;

// This function lazily initializes the Redis store for the rate limiter.
// It ensures that the async operation to get the Redis client
// does not happen at the top level of the module.
const getStore = async (): Promise<Store> => {
  if (!sharedStore) {
    const kv = await container.getAsync<Redis>(KVSymbol);
    sharedStore = new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => kv.call(...args),
    });
  }
  return sharedStore;
};

// A factory function to create a rate limiter middleware.
// It handles the async store initialization and skips rate limiting in development.
const createAsyncRateLimiter = (
  options: Omit<Parameters<typeof rateLimiter>[0], "store">,
): MiddlewareHandler => {
  let limiter: RateLimiterMiddleware | undefined;

  return async (c, next) => {
    if (options.skip && options.skip(c)) {
      return next();
    }

    if (!limiter) {
      const store = await getStore();
      limiter = rateLimiter({ ...options, store });
    }

    // We need to handle the case where the limiter itself calls next().
    // The return value of the limiter function is what determines if the chain continues.
    return limiter(c, next);
  };
};

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
export const signUpRateLimiter = createAsyncRateLimiter({
  windowMs: 1000 * 60 * 60 * 8, // 8 hours, standard work day
  limit: 50, // 50 sign ups per 8 hours, ex team onboarding throughout the day
  keyGenerator: (c) => {
    const connInfo = getConnInfo(c);
    return `${connInfo.remote.address}`; // base solely on IP address to prevent spamming
  },
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
export const signInRateLimiter = createAsyncRateLimiter({
  windowMs: 1000 * 60 * 30, // 30 minutes
  limit: 5, // this is the standard lock out rate for Windows devices
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the zValidator middleware
    const { email } = c.req.valid("json");
    const connInfo = getConnInfo(c);
    return `${email}:${connInfo.remote.address}`; // email:
  },
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
export const otpRateLimiter = createAsyncRateLimiter({
  windowMs: 1000 * 60 * 30, // 30 minutes
  limit: 5, // 5 attempts
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the userMiddleware
    const userId = c.get("userId");
    const connInfo = getConnInfo(c);
    return `${userId}:${connInfo.remote.address}`;
  },
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
export const resetPasswordRateLimiter = createAsyncRateLimiter({
  windowMs: 1000 * 60 * 60 * 24, // 24 hours
  limit: 3, // 3 attempts
  keyGenerator: async (c) => {
    // @ts-expect-error - Assumes this middleware is run before the zValidator middleware
    const { email } = c.req.valid("json");
    const connInfo = getConnInfo(c);
    return `${email}:${connInfo.remote.address}`;
  },
  skip: () => ENVIRONMENT === "development",
});

/**
 * Rate limiter middleware factory for unit management operations.
 * Creates specific rate limiters for different unit operations.
 *
 * @remarks
 * Different operations have different limits:
 * - Unit Creation: 10/hour (resource intensive, infrequent)
 * - Unit Updates: 30/hour (moderate frequency)
 * - User Management: 100/hour (frequent, less intensive)
 * - Invites: 20/hour (security sensitive)
 * - List Operations: 200/hour (read-only, frequent)
 *
 * @param operationType - The type of unit operation
 * @returns An appropriate rate limiter for the operation
 */
const createUnitRateLimiter = (operationType: string) =>
  createAsyncRateLimiter({
    windowMs: 1000 * 60 * 60, // 1 hour base window
    limit: (() => {
      switch (operationType) {
        case "create":
          return 10; // Creating units is resource intensive
        case "update":
          return 30; // Updating units is moderately frequent
        case "invite":
          return 20; // Invites are security sensitive
        case "user_manage":
          return 100; // User operations are more frequent
        case "list":
          return 200; // List operations are read-only and frequent
        default:
          return 50; // Default fallback
      }
    })(),
    keyGenerator: (c) => {
      const connInfo = getConnInfo(c);
      // Include operation type in key for separate limits
      return `unit:${operationType}:${connInfo.remote.address}`;
    },
    skip: () => ENVIRONMENT === "development",
  });

/**
 * Rate limiter for unit creation operations.
 * Most restrictive due to resource intensity.
 */
export const unitCreateRateLimiter = createUnitRateLimiter("create");

/**
 * Rate limiter for unit update operations.
 * Moderate limits for administrative changes.
 */
export const unitUpdateRateLimiter = createUnitRateLimiter("update");

/**
 * Rate limiter for unit invite operations.
 * Restricted to prevent invite abuse.
 */
export const unitInviteRateLimiter = createUnitRateLimiter("invite");

/**
 * Rate limiter for user management operations.
 * Higher limits for frequent user changes.
 */
export const unitUserManageRateLimiter = createUnitRateLimiter("user_manage");

/**
 * Rate limiter for list operations.
 * Highest limits for read-only operations.
 */
export const unitListRateLimiter = createUnitRateLimiter("list");

/**
 * Legacy unit rate limiter for backward compatibility.
 * @deprecated Use specific operation rate limiters instead.
 */
export const unitRateLimiter = createUnitRateLimiter("default");