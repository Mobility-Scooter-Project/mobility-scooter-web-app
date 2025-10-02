import { AppConfig } from '@config/constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TestingModule, Test } from '@nestjs/testing';
import { PermissionsMiddleware } from './permissions.middleware';
import config from '@config/constants';
import { Repository } from 'typeorm';
import { RoutePermissions } from '@infra/db/entity/user/route-permissions';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { KvService } from '@infra/kv/kv.service';
import { InfraModule } from '@infra/infra.module';
import { createMock } from '@golevelup/ts-jest';
import { USER_ROLES } from '@config/enums';

describe('PermissionsMiddleware', () => {
  let middleware: PermissionsMiddleware;
  let routePermissionRepository: Repository<RoutePermissions>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService<AppConfig>) => ({
            secret: configService.get('jwtSecret'),
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([RoutePermissions]),
        InfraModule,
      ],
      providers: [PermissionsMiddleware],
    })
      .useMocker(createMock)
      .compile();

    routePermissionRepository = module.get<Repository<RoutePermissions>>(
      getRepositoryToken(RoutePermissions),
    );
    const kvService = module.get<KvService>(KvService);
    middleware = new PermissionsMiddleware(
      routePermissionRepository,
      kvService,
    );

    jest
      .spyOn(middleware as any, '_getPermissionsFromKv')
      .mockImplementation(async (path: string, method: string) => {
        if (path === '/api/v1/units/*/users/*' && method === 'PUT') {
          return USER_ROLES.ADMIN;
        }
        return null;
      });
  });

  describe('use', () => {
    it('should allow access for valid permissions', async () => {
      const req: any = {
        locals: {
          userId: 1,
          userRole: USER_ROLES.ADMIN,
        },
        path: '/api/v1/units/123/users',
        method: 'GET',
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      jest
        .spyOn(middleware as any, '_getPermissionsFromKv')
        .mockResolvedValue([USER_ROLES.ADMIN]);
      await middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for invalid permissions', async () => {
      const req: any = {
        locals: {
          userId: 1,
          userRole: USER_ROLES.TRAINEE,
        },
        path: '/api/v1/units/123/users/123',
        method: 'PUT',
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      jest
        .spyOn(middleware as any, '_getPermissionsFromKv')
        .mockResolvedValue(USER_ROLES.ADMIN);

      await middleware.use(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });
});
