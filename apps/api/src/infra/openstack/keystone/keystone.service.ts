import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class KeystoneService {
  private body: any;
  private BASE_URL: string;

  private client: HttpService;
  private readonly logger = new Logger(KeystoneService.name);

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly httpService: HttpService,
  ) {
    this.BASE_URL = this.configService.get('keystone').url;
    const CLIENT_ID = this.configService.get('keystone').clientId;
    const CLIENT_SECRET = this.configService.get('keystone').clientSecret;

    this.body = {
      auth: {
        identity: {
          methods: ['application_credential'],
          application_credential: {
            id: CLIENT_ID,
            secret: CLIENT_SECRET,
          },
        },
      },
    };

    this.client = httpService;
  }

  /**
   * Retrieves an authentication token from the Keystone identity service.
   *
   * Makes a POST request to the Keystone auth endpoint with the configured credentials
   * and extracts the token from the response headers.
   *
   * @returns A Promise that resolves to the authentication token string
   * @throws {HttpException} Throws an HttpException with status 500 if the token request fails
   *
   * @example
   * ```typescript
   * const token = await keystoneService.getToken();
   * console.log('Token:', token);
   * ```
   */
  public async getToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.client
          .post(`${this.BASE_URL}/auth/tokens`, this.body, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .pipe(
            catchError((error) => {
              this.logger.error('Error in KeystoneService getToken:', error);
              throw new HttpException(
                'Failed to fetch token from Keystone',
                500,
              );
            }),
          ),
      );

      return response.headers['x-subject-token'];
    } catch (error) {
      this.logger.error('Error fetching token from Keystone:', error);
      throw new HttpException('Failed to fetch token from Keystone', 500);
    }
  }
}
