import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config';
import { KeystoneService } from '../keystone/keystone.service';
import { KvService } from 'src/kv/kv.service';
import { HttpService } from '@nestjs/axios';
import { AxiosInstance } from 'axios';

@Injectable()
export class BarbicanService {
    private keystone: KeystoneService;
    private kv: KvService;
    private client: AxiosInstance;

    private constructor(
        private readonly KeystoneService: KeystoneService,
        private readonly KVService: KvService,
    ) {
        this.keystone = KeystoneService;
        this.kv = KVService;
    }

    public static async build(
        configService: ConfigService<AppConfig>,
        keystone: KeystoneService,
        kv: KvService,
        httpService: HttpService
    ): Promise<BarbicanService> {
        const barbican = new BarbicanService(
            keystone,
            kv
        );

        const token = await keystone.getToken();

        barbican.client = httpService.axiosRef.create({
            baseURL: configService.get('vault').url,
            headers: {
                'X-Auth-Token': token,
                'Content-Type': 'application/json',
                'Accept': '*/*',
            },
        });

        return barbican;
    }

}
