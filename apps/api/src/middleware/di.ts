import container from "@src/lib/container";
import { Context, Next } from "hono";

export const diMiddleware = (c: Context, next: Next) => {
    c.set("container", container);
    return next();
}