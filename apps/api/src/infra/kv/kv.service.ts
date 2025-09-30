import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '@config/constants';
import { InjectRepository } from '@nestjs/typeorm';
import { RoutePermissions } from '@infra/db/entity/user/route-permissions';
import { Repository } from 'typeorm';

/**
 * Service to interact with a Redis/Valkey key-value store.
 */
@Injectable()
export class KvService {
  private _kv: Redis;
  private logger = new Logger(KvService.name);

  constructor(
    private configService: ConfigService<AppConfig>,
    @InjectRepository(RoutePermissions)
    private readonly routePermissionsRepository: Repository<RoutePermissions>,
  ) {
    this._kv = new Redis(this.configService.get('kv').url);
  }

  /**
   * Get the Redis client instance.
   */
  get kv(): Redis {
    return this._kv;
  }

  public async loadPermissions() {
    const permissions = await this.routePermissionsRepository.find();

    const pipeline = this.kv.pipeline();

    permissions.forEach((perm: RoutePermissions) => {
      pipeline.hset(
        `user_permissions:${perm.route}`,
        perm.method,
        perm.role.join(','),
      );
    });

    try {
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error loading permissions into KV', error);
      throw new HttpException('Internal Server Error', 500);
    }
    this.logger.log('Permissions loaded into KV store');
  }
}
