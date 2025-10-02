import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { createMock } from '@golevelup/ts-jest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@infra/db/entity/user/user';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([User])],
      providers: [UsersService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      jest.spyOn(userRepository, 'findOneBy').mockResolvedValue(mockUser);

      const user = await service.findById('1');
      expect(user).toEqual(mockUser);
    });
  });

  describe('updateById', () => {
    it('should update and return the user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      jest.spyOn(userRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const updatedUser = await service.updateById('1', 'unit1', {
        email: 'test@example.com',
      });
      expect(updatedUser).toEqual(mockUser);
    });
  });

  describe('deleteById', () => {
    it('should delete the user', async () => {
      jest.spyOn(userRepository, 'delete').mockResolvedValue({} as any);

      await expect(service.deleteById('1', 'unit1')).resolves.not.toThrow();
    });
  });

  describe('getByUnitId', () => {
    it('should return users for a given unit ID', async () => {
      const mockUsers = [
        { id: '1', email: 'test@example.com' } as User,
        { id: '2', email: 'test2@example.com' } as User,
      ];
      jest.spyOn(userRepository, 'find').mockResolvedValue(mockUsers);

      const users = await service.getByUnitId('unit1');
      expect(users).toEqual(mockUsers);
    });
  });
});
