import { sessions } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { HTTPException } from "hono/http-exception";

const createSession = async (db: DB, userId: string) => {
  try {
    const data = await db.insert(sessions).values({ userId }).returning();
    return data[0];
  } catch (e) {
    console.error(`Failed to create session: ${e}`);
    throw new HTTPException(501, { message: "Failed to create session" });
  }
};

export const sessionRepository = {
  createSession,
};
