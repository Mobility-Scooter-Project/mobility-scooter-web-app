import { User } from '@infra/db/entity/user/user';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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

  public async updateProfile(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    await this.userRepository.update({ id: userId }, updateData);
    return this.getProfile(userId);
  }
}
