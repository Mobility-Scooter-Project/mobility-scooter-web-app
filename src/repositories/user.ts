import { users } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { HTTPException } from "hono/http-exception";

type NewUser = typeof users.$inferInsert;

const createUser = async (db: DB, newUser: NewUser) => {
  try {
    const data = await db
      .insert(users)
      .values(newUser)
      .returning({ id: users.id });
    return data[0];
  } catch (e: any) {
    if (e.code && e.code === "23505") {
      throw new HTTPException(409, {
        res: new Response(
          JSON.stringify({ data: null, error: "User already exists" })
        ),
      });
    }

    console.error(`Failed to create user: ${e}`);
    throw new HTTPException(501, { message: "Failed to create user" });
  }
};

export const userRepository = {
  createUser,
};
