import { getConnInfo } from "@hono/node-server/conninfo";
import { ENVIRONMENT } from "@src/config/constants";
import { kv } from "@src/integrations/kv";
import { rateLimiter } from "hono-rate-limiter";
import RedisStore from "rate-limit-redis";

const sharedStore = new RedisStore({
  // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
  sendCommand: (...args: string[]) => kv.call(...args),
});

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
