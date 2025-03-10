import { refreshTokens } from "@db/schema/auth";
import { signJWT } from "@lib/jwt";
import { DB } from "@middleware/db";
import { HTTPException } from "hono/http-exception";

const createRefreshToken = async (
  db: DB,
  userId: string,
  sessionId: string
) => {
  try {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const token = await signJWT({
      userId,
      sessionId,
      exp: expiresAt,
      iat: new Date(),
    });

    const data = await db
      .insert(refreshTokens)
      .values({ sessionId, token, userId, expiresAt })
      .returning();
    return data[0].token;
  } catch (e) {
    console.error(`Failed to create refresh token: ${e}`);
    throw new HTTPException(501, { message: "Failed to create refresh token" });
  }
};

export const refreshTokenRepository = {
  createRefreshToken,
};
