import { JWT_SECRET } from "@config/constants";
import { sign } from "hono/jwt";

/**
 * Signs a JSON Web Token (JWT) with the provided payload using the JWT_SECRET.
 *
 * @param {Record<string, unknown>} payload - The data to be encoded in the JWT.
 * @returns {Promise<string>} A Promise that resolves to the signed JWT string.
 *
 * @example
 * const payload = { userId: '123', role: 'admin' };
 * const token = await signJWT(payload);
 */
export const signJWT = async (payload: Record<string, unknown>) => {
  return await sign(payload, JWT_SECRET);
};
