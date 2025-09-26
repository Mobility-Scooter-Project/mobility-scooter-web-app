import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { ConfigModule } from '@nestjs/config';
import config from '@src/config';
import { InfraModule } from '@infra/infra.module';
import { createMock } from '@golevelup/ts-jest';
import { BarbicanService } from '@infra/openstack/barbican/barbican.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        InfraModule,
      ],
      providers: [OtpService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<OtpService>(OtpService);
    const vault = module.get<BarbicanService>(BarbicanService);

    jest
      .spyOn(service as any, '_getUserEmailById')
      .mockResolvedValue('test@example.com');
    jest.spyOn(vault, 'createOtpSecret').mockResolvedValue();
    jest
      .spyOn(vault, 'getOtpSecretByUserId')
      .mockResolvedValue('JBSWY3DPEHPK3PXP'); // base32 for 'Hello!'
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate an OTP for a valid user ID', async () => {
      const result = await service.generateOtp('valid-user-id');

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('secret');
      expect(result.secret).toHaveLength(32);
    });
  });

  // verifyOtp is not tested here as we have no local 2FA app to generate valid tokens against the mocked secret.
});
