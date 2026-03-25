import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@infra/db/entity/user/user';

@Injectable()
export class UnitAuthorizationService {
  private logger = new Logger(UnitAuthorizationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Ensures the user belongs to the given unit.
   */
  public async assertUserInUnit(
    userId: string,
    unitId: string,
  ): Promise<void> {
    let user: User | null;
    try {
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { unit: true },
        select: { id: true, unit: { id: true } },
      });
    } catch (error) {
      this.logger.error('Failed to verify user unit', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!user?.unit || user.unit.id !== unitId) {
      this.logger.warn(
        `User ${userId} attempted access to unit ${unitId} but does not belong to that unit`,
      );
      throw new HttpException(
        'User does not belong to this unit',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

