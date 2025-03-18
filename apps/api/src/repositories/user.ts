import { identities, users } from '@db/schema/auth'
import type { DB } from '@middleware/db'
import { eq, sql, and } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'

type NewUser = typeof users.$inferInsert;

/**
 * Creates a new user in the database with encrypted password and associated identity.
 *
 * @param db - The database instance to perform the transaction
 * @param newUser - The new user data to be inserted
 * @returns Promise containing the created user's ID
 * @throws {HTTPException}
 *  - 409 if user already exists (duplicate entry)
 *  - 501 if user creation fails for other reasons
 *
 * @remarks
 * This function:
 * 1. Encrypts the password if provided
 * 2. Creates user record within a transaction
 * 3. Sets session user_id and role
 * 4. Creates an "emailpass" identity for the user if none exists
 */
const createUser = async (db: DB, newUser: NewUser) => {
  const encryptedPassword = newUser.encryptedPassword
    ? sql`crypt(${newUser.encryptedPassword}, gen_salt('bf'))`
    : null
  try {
    const data = await db.transaction(async (tx) => {
      const data = await tx
        .insert(users)
        .values({
          ...newUser,
          encryptedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: users.id })

      await tx.execute(sql.raw(`SET SESSION app.user_id = '${data[0].id}'`))
      await tx.execute(sql`SET ROLE authenticated_user`)

      const identity = await tx
        .select()
        .from(identities)
        .where(eq(identities.userId, data[0].id))

      if (!identity[0]) {
        await tx.insert(identities).values({
          userId: data[0].id,
          provider: 'emailpass',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return data
    })
    return data[0]
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && e.code === '23505') {
      throw new HTTPException(409, {
        res: new Response(
          JSON.stringify({ data: null, error: 'User already exists' }),
        ),
      })
    }

    console.error(`Failed to create user: ${e}`)
    throw new HTTPException(501, { message: 'Failed to create user' })
  }
}

/**
 * Retrieves a user from the database by their email address
 * @param db - Database instance
 * @param email - Email address to search for
 * @returns The first user found with the matching email, or undefined if none exists
 */
export const findUserByEmail = async (db: DB, email: string) => {
  const data = await db.select().from(users).where(eq(users.email, email))
  return data[0]
}

/**
 * Finds a user in the database by email and password.
 * The password is verified against the encrypted password stored in the database using PostgreSQL's crypt function.
 *
 * @param db - The database connection instance
 * @param email - The email address of the user to find
 * @param password - The plain text password to verify
 * @returns The first matching user record or undefined if no match is found
 */
export const findUserWithPassword = async (
  db: DB,
  email: string,
  password: string,
) => {
  const data = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(
          users.encryptedPassword,
          sql`crypt(${password}, ${users.encryptedPassword})`,
        ),
      ),
    )
  return data[0]
}

/**
 * Retrieves a user from the database by their unique identifier.
 *
 * @param db - The database connection instance
 * @param id - The unique identifier of the user to find
 * @returns The first user that matches the specified ID, or undefined if no user is found
 */
const findUserById = async (db: DB, id: string) => {
  const data = await db.select().from(users).where(eq(users.id, id))
  return data[0]
}

/**
 * Updates a user's password in the database.
 * The password is encrypted using the Blowfish encryption algorithm with a salt.
 *
 * @param db - Database connection instance
 * @param userId - Unique identifier of the user
 * @param password - New password in plain text
 * @returns {Promise<void>} - A promise that resolves when the password has been updated
 */
const updatePassword = async (db: DB, userId: string, password: string) => {
  const encryptedPassword = sql`crypt(${password}, gen_salt('bf'))`
  await db.update(users).set({ encryptedPassword }).where(eq(users.id, userId))
}

export const userRepository = {
  createUser,
  findUserByEmail,
  findUserWithPassword,
  findUserById,
  updatePassword,
}
