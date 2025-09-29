import { users } from '@src/db/schema/auth';
import { type DB } from '@middleware/db';
import { HTTP_CODES } from '@src/config/http-codes';
import { HTTPError } from '@src/lib/errors';
import { usersRepository } from '@src/repositories/users';
import { StorageService } from './storage';
import { FILE_TYPES } from '@src/config/file-types';

type NewUser = typeof users.$inferInsert;

/**
 * UsersService is the business logic for users/ route
 */
export class UsersService {
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
        'Failed to update user',
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
        'Failed to delete user',
      );
    }
  }

  /**
   * Updates a user's profile picture URL and
   * Upload a user's profile picture into the storage
   */
  async updatePfp(db: DB, userId: string, storage: StorageService, file: File) {
    if (!file) {
      throw new HTTPError(HTTP_CODES.BAD_REQUEST, null, 'No file provided');
    }

    const fileName = file.name || 'pfp.jpg';
    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();

    const allowed = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
    if (!allowed.has(ext)) {
      throw new HTTPError(
        HTTP_CODES.BAD_REQUEST,
        null,
        'Unsupported file type for profile picture',
      );
    }

    const filePath = `users/${userId}/pfp.${ext}`;

    const uploadStream = file.stream();
    await storage.putObjectStream(
      filePath,
      uploadStream,
      new Date(),
      FILE_TYPES.IMAGE,
    );

    // Get a presigned GET url for clients to load the avatar
    const { url } = await storage.generatePresignedGetUrl(filePath);

    // Persist on users table
    await usersRepository.updatePfp(db, userId, url);

    return { data: { pfpUrl: url }, error: null };
  }

  /**
   * Removes a user's profile picture url and
   * Delete it from storage
   */
  async removePfp(db: DB, userId: string, storage: StorageService) {
    try {
      const user = await usersRepository.getUserById(db, userId);
      if (!user.data || !user.data.pfpUrl) {
        await usersRepository.removePfp(db, userId);
        return { data: { removed: false }, error: null };
      }

      const u = new URL(user.data.pfpUrl);
      const filePath: string | null = u.searchParams.get('X-MSWA-FilePath');
      if (!filePath) {
        throw new HTTPError(
          HTTP_CODES.BAD_REQUEST,
          null,
          'Invalid stored profile picture URL (missing X-MSWA-FilePath)',
        );
      }

      await storage.deleteObject(filePath);
      await usersRepository.removePfp(db, userId);
      return { data: { removed: true }, error: null };
    } catch (e) {
      throw new HTTPError(
        HTTP_CODES.INTERNAL_SERVER_ERROR,
        e,
        'Failed to remove profile picture',
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
        'Failed to update user',
      );
    }
  }
}

export const usersService = new UsersService();
