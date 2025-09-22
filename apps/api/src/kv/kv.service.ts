import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from 'src/config';

@Injectable()
export class KvService {
    private kv: Redis;

    constructor(private configService: ConfigService<AppConfig>) {
        this.kv = new Redis(
            this.configService.get("kv").url
        );
    }
}
