import { users } from "@src/db/schema/auth";
import { postgresDB, type DB } from "@middleware/db";
import { HTTP_CODES } from "@src/config/http-codes";
import { HTTPError } from "@src/lib/errors";
import { usersRepository } from "@src/repositories/users";
type NewUser = typeof users.$inferInsert;

/**
 * UsersService is the business logic for users/ route
 */
export class UsersService {
  private db: DB;
  constructor(db?: DB) {
    this.db = db ?? postgresDB;
  }
  /**
   * Retrieves a user by ID with optional field selection
   */
  async getUserById(db: DB, userId: string, fields?: string[]) {
    try {
      return await usersRepository.getUserById(db, userId, fields);
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to update user",
      );
    }
  }

  /**
   * Soft deletes a user by setting the deletedAt timestamp
   */
  async softDeleteUser(db: DB, userId: string) {
    try {
      return await usersRepository.softDeleteUser(db, userId);
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to delete user",
      );
    }
  }

  /**
   * Updates a user's profile picture URL
   */
  async updatePfp(db: DB, userId: string, pfpUrl: string) {
    try {
      return await usersRepository.updatePfp(db, userId, pfpUrl);
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to update profile picture",
      );
    }
  }

  /**
   * Removes a user's profile picture by setting pfpUrl to null
   */
  async removePfp(db: DB, userId: string) {
    try {
      return await usersRepository.removePfp(db, userId);
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to remove profile picture",
      );
    }
  }

  /**
   * Updates a user's profile information
   */
  async updateUser(db: DB, userId: string, updateData: Partial<NewUser>) {
    try {
      return await usersRepository.updateUser(db, userId, updateData);
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        "Failed to update user",
      );
    }
  }
}

export const usersService = new UsersService();
