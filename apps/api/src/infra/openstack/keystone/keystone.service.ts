import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class KeystoneService {
    private body: any;
    private BASE_URL: string;

    private client: HttpService;

    constructor(
        private readonly configService: ConfigService<AppConfig>,
        private readonly httpService: HttpService
    ) {
        this.BASE_URL = this.configService.get('keystone').url;
        const CLIENT_ID = this.configService.get('keystone').clientId;
        const CLIENT_SECRET = this.configService.get('keystone').clientSecret;

        this.body = {
            auth: {
                identity: {
                    methods: [
                        "application_credential"
                    ],
                    application_credential: {
                        id: CLIENT_ID,
                        secret: CLIENT_SECRET
                    }
                }
            }
        };

        this.client = httpService;
    }

    public async getToken(): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.client.post(`${this.BASE_URL}/auth/tokens`, this.body, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).pipe(
                    catchError((error) => {
                        console.error('Error in KeystoneService getToken:', error);
                        throw new Error('Failed to fetch token from Keystone');
                    })
                )
            );

            return response.headers['x-subject-token'];
        } catch (error) {
            console.error('Error fetching token from Keystone:', error);
            throw new Error('Failed to fetch token from Keystone');
        }
    }
}
