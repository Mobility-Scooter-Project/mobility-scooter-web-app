import { User } from '@infra/db/entity/user/user';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   *  Find a user by their ID.
   *
   * @param id - User ID
   * @returns - User or null if not found
   */
  public async findById(id: string): Promise<User | null> {
    let user: User | null;

    try {
      user = await this.usersRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${id}`, error);
      return null;
    }

    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new HttpException('User not found', 404);
    }

    return user;
  }

  /**
   *  Update a user by their ID.
   *
   * @param id - User ID
   * @param unitId - Unit ID
   * @param updateData - Data to update
   * @returns Updated user
   */
  public async updateById(
    id: string,
    unitId: string,
    updateData: Partial<User>,
  ): Promise<User> {
    let user: User | null;

    try {
      await this.usersRepository.update(id, updateData);
      user = await this.usersRepository.findOne({
        select: {
          id: true,
          email: true,
          givenName: true,
          surname: true,
          role: true,
          title: true,
          phoneNumber: true,
          city: true,
          unit: true,
        },
        where: { id, unit: { id: unitId } },
      });
    } catch (error) {
      this.logger.error(`Failed to update user by ID: ${id}`, error);
      throw new HttpException('Failed to update user', 500);
    }

    if (!user) {
      this.logger.warn(`User not found after update with ID: ${id}`);
      throw new HttpException('User not found', 404);
    }

    return user;
  }

  /**
   *  Soft delete a user by their ID.
   *
   * @param id - User ID
   * @param unitId - Unit ID
   */
  public async deleteById(id: string, unitId: string): Promise<void> {
    // error handling is done in updateById
    await this.updateById(id, unitId, { cud: { deletedAt: new Date() } });
  }

  public async getByUnitId(unitId: string): Promise<User[]> {
    let users: User[] | null;

    try {
      users = await this.usersRepository.find({
        select: {
          id: true,
          email: true,
          givenName: true,
          surname: true,
          role: true,
          title: true,
          phoneNumber: true,
          city: true,
          unit: true,
        },
        where: { unit: { id: unitId } },
      });
    } catch (error) {
      this.logger.error(`Failed to get users by unit ID: ${unitId}`, error);
      throw new HttpException('Failed to get users', 500);
    }

    if (!users || users.length == 0) {
      this.logger.warn(`No users found for unit ID: ${unitId}`);
      return [];
    }

    return users;
  }
}
