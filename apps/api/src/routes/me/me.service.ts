import { User } from '@infra/db/entity/user/user';
import { SwiftService } from '@infra/openstack/swift/swift.service';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'stream';
import { Repository } from 'typeorm';

@Injectable()
export class MeService {
  private logger = new Logger(MeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly swiftService: SwiftService,
  ) {}

  /**
   * Get user profile by user ID
   * @param userId - ID of the user
   * @returns User profile or null if not found
   */
  public async getProfile(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        givenName: true,
        surname: true,
        role: true,
        title: true,
        phoneNumber: true,
        city: true,
      },
    });
  }

  /**
   *  Update user profile.
   *
   * @param userId - ID of the user
   * @param updateData - Data to update
   * @returns
   */
  public async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update({ id: userId }, updateData);
    return this.getProfile(userId);
  }

  /**
   *  Upload profile picture to OpenStack Swift.
   *
   * @param userId - ID of the user
   * @param file - Profile picture file
   */
  public async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const path = `users/${userId}/profile/${file.originalname}`;

    try {
      await this.swiftService.putObjectStream(path, Readable.from(file.buffer));
    } catch (error) {
      this.logger.error(
        `Failed to upload profile picture for user ${userId}: ${error}`,
      );
      throw new HttpException('Failed to upload profile picture', 500);
    }
  }
}
