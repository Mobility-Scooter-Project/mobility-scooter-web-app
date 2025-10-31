import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '@config/constants';

/**
 * Service to interact with a Redis/Valkey key-value store.
 */
@Injectable()
export class KvService {
  private _kv: Redis;

  constructor(private configService: ConfigService<AppConfig>) {
    this._kv = new Redis(this.configService.get('kv').url);
  }

  /**
   * Get the Redis client instance.
   */
  get kv(): Redis {
    return this._kv;
  }
}
