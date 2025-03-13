import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo } from "@hono/node-server/conninfo";
import { kv } from "@src/lib/kv";
import RedisStore from "rate-limit-redis";
import { ENVIRONMENT } from "@src/config/constants";

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
  //@ts-ignore
  store: sharedStore,
  skip: (c) => ENVIRONMENT === "development",
});

export const signInRateLimiter = rateLimiter({
  windowMs: 1000 * 60 * 30, // 30 minutes
  limit: 5, // this is the standard lock out rate for Windows devices
  keyGenerator: (c) => {
    //@ts-ignore
    const { email } = c.json();
    const connInfo = getConnInfo(c);
    return `${email}:${connInfo.remote.address}`; // test@example.com:127.0.0.1 -> prevents subnets from being locked out
  },
  //@ts-ignore
  store: sharedStore,
  skip: (c) => ENVIRONMENT === "development",
});
