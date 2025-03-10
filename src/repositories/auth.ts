import { db } from "@db/client";
import {
  users,
  providers,
  identities,
  sessions,
  refreshTokens,
} from "@db/schema/auth";
import { signJWT } from "@lib/jwt";
import { HTTPException } from "hono/http-exception";

type NewUser = typeof users.$inferInsert;

export const createUser = async (newUser: NewUser) => {
  try {
    const data = await db
      .insert(users)
      .values(newUser)
      .returning({ id: users.id });
    return data[0];
  } catch (e) {
    console.error(`Failed to create user: ${e}`);
    throw new HTTPException(501, { message: "Failed to create user" });
  }
};

export const createIdentity = async (
  userId: string,
  provider: (typeof providers.enumValues)[0]
) => {
  try {
    const data = await db
      .insert(identities)
      .values({
        userId,
        provider,
      })
      .returning();
    return data[0];
  } catch (e) {
    console.error(`Failed to create identity: ${e}`);
    throw new HTTPException(501, { message: "Failed to create identity" });
  }
};

export const createSession = async (userId: string) => {
  try {
    const data = await db.insert(sessions).values({ userId }).returning();
    return data[0];
  } catch (e) {
    console.error(`Failed to create session: ${e}`);
    throw new HTTPException(501, { message: "Failed to create session" });
  }
};

export const createRefreshToken = async (userId: string, sessionId: string) => {
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
