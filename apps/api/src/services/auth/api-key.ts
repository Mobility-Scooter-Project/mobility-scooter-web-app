import { apiKeys } from '@src/db/schema/auth'
import type { DB } from '@src/middleware/db'
import { sql, eq } from 'drizzle-orm'

/**
 * Retrieves and validates an API key from the database
 * @param key - The API key to validate
 * @returns Promise that resolves to a boolean indicating whether the key exists and is active
 * @example
 * ```typescript
 * const isValid = await retrieveApiKey('some-api-key');
 * if (isValid) {
 *   // API key is valid and active
 * }
 * ```
 */
const retrieveApiKey = async (db: DB, key: string) => {
  const data = await db.query.apiKeys.findFirst({
    where: (fields) =>
      sql`${fields.encryptedKey} = crypt(${key}, ${fields.encryptedKey}) and ${
        fields.isActive
      } = ${true}`,
  })
  if (data && data.isActive) {
    try {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, data.id))
    } catch (e) {
      console.error(`Failed to update API key: ${e}`)
    }
    return true
  }
  return false
}

export const apiKeyService = {
  retrieveApiKey,
}
