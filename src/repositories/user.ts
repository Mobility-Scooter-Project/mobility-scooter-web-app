import { users } from "@db/schema/auth";
import { DB } from "@middleware/db";
import { eq, sql, and } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export type NewUser = typeof users.$inferInsert;
export type ExistingUser = typeof users.$inferSelect;

const createUser = async (db: DB, newUser: NewUser) => {
  const encryptedPassword = newUser.encryptedPassword
    ? sql`crypt(${newUser.encryptedPassword}, gen_salt('bf'))`
    : null;
  try {
    const data = await db
      .insert(users)
      .values({
        ...newUser,
        encryptedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
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

export const findUserByEmail = async (db: DB, email: string) => {
  const data = await db.select().from(users).where(eq(users.email, email));
  return data[0];
};

export const findUserWithPassword = async (
  db: DB,
  email: string,
  password: string
) => {
  const data = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(
          users.encryptedPassword,
          sql`crypt(${password}, ${users.encryptedPassword})`
        )
      )
    );
  return data[0];
};

export const userRepository = {
  createUser,
  findUserByEmail,
  findUserWithPassword,
};
