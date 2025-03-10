import { JWT_SECRET } from "@config/constants";
import { sign } from "hono/jwt";

export const signJWT = async (payload: Record<string, any>) => {
  return await sign(payload, JWT_SECRET);
};
