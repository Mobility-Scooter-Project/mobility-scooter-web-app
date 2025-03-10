import { db } from "@db/client";
import { users, providers, identities } from "@db/schema/auth";
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
