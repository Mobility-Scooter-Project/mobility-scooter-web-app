import { Test, TestingModule } from '@nestjs/testing';
import { KeystoneService } from './keystone.service';
import { HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';

describe('KeystoneService', () => {
  let service: KeystoneService;
  let httpService: HttpService;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn().mockReturnValue(
        of({
          data: {},
          status: 201,
          statusText: 'Created',
          headers: {
            'x-subject-token': 'mocked-token-12345',
          },
          config: {},
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              keystone: {
                url: 'http://test-keystone-url',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
              },
            }),
          ],
        }),
      ],
      providers: [
        KeystoneService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<KeystoneService>(KeystoneService);
    httpService = module.get<HttpService>(HttpService);

    service = module.get<KeystoneService>(KeystoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a token', async () => {
    const token = await service.getToken();

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toBe('mocked-token-12345');
    expect(token.length).toBeGreaterThan(0);
  });
});
