import { JWT_SECRET } from "@config/constants";
import { sign } from "hono/jwt";
import { HTTPError } from "./errors";
import { HTTP_CODES } from "@src/config/http-codes";

/**
 * Signs a JSON Web Token (JWT) with the provided payload using JWT_SECRET.
 * @param payload - An object containing the data to be signed in the JWT
 * @returns Promise<string> - A promise that resolves to the signed JWT string
 * @throws {HTTPError} With status 500 if JWT signing fails
 */
export const signJWT = async (payload: Record<string, unknown>) => {
  try {
    return await sign(payload, JWT_SECRET);
  } catch (error) {
    throw new HTTPError(
      HTTP_CODES.INTERNAL_SERVER_ERROR,
      error,
      "Failed to sign JWT"
    );
  }
};
