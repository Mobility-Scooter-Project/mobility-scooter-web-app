import { identities, providers } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { HTTPException } from "hono/http-exception";

const createIdentity = async (
  db: DB,
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

export const identityRepository = {
  createIdentity,
};
