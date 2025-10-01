import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import { JwtMiddleware } from './jwt.middleware';
import config, { AppConfig } from '@config/constants';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('JwtMiddleware', () => {
  let service: JwtService;
  let jwtMiddleware: JwtMiddleware;

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
      ],
      providers: [JwtService],
    }).compile();

    service = module.get<JwtService>(JwtService);
    jwtMiddleware = new JwtMiddleware(
      service,
      module.get<ConfigService<AppConfig>>(ConfigService),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('use', () => {
    it('should return 400 if the auth header is missing', async () => {
      const req: any = { headers: {} };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await jwtMiddleware.use(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authorization header missing',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if the token is missing', async () => {
      const req: any = { headers: { authorization: 'Bearer' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await jwtMiddleware.use(req, res, next);
    });

    it('should return 400 if the token is invalid', async () => {
      const req: any = { headers: { authorization: 'Bearer invalidtoken' } };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await jwtMiddleware.use(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if the token is valid', async () => {
      const token = await service.signAsync({
        userId: 'user1',
        sessionId: 'session1',
      });
      const req: any = { headers: { authorization: `Bearer ${token}` } };
      const res: any = {};
      const next = jest.fn();

      await jwtMiddleware.use(req, res, next);

      expect(req.locals).toEqual({ userId: 'user1', sessionId: 'session1' });
      expect(next).toHaveBeenCalled();
    });
  });
});
