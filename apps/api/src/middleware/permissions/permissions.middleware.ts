import { USER_ROLES } from '@config/enums';
import { TypedRequest } from '@config/request';
import { RoutePermissions } from '@infra/db/entity/user/route-permissions';
import { KvService } from '@infra/kv/kv.service';
import {
  HttpException,
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsMiddleware implements NestMiddleware {
  private logger = new Logger(PermissionsMiddleware.name);
  private kv: Redis;

  constructor(
    @InjectRepository(RoutePermissions)
    private readonly routePermissionsRepository: Repository<RoutePermissions>,
    private readonly KvService: KvService,
  ) {
    this.kv = this.KvService.kv;
  }

  private _reconstructPath(path: string): string {
    const segments = path.split('/');
    const reconstructedSegments = segments.map((segment) => {
      if (segment.match(/^\d+$/) || segment.match(/^[0-9a-fA-F-]{36}$/)) {
        return '*';
      }
      return segment;
    });
    const res = reconstructedSegments.join('/');
    this.logger.debug(`Reconstructed path: ${res}`);
    return res;
  }

  private async _getPermissionsFromKv(
    path: string,
    method: string,
  ): Promise<string | null> {
    try {
      const permissions = await this.kv.hget(
        `user_permissions:${path}`,
        method,
      );
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching permissions from KV', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }

  private async _loadPermissions() {
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

  private async _checkRoutePermissions(
    userRole: USER_ROLES,
    path: string,
    method: string,
  ): Promise<boolean> {
    let permissions: string | null;
    try {
      permissions = await this._getPermissionsFromKv(path, method);
    } catch {
      return false;
    }

    // this handles the case where the permissions are not yet loaded into the KV
    // or a new route has been added since the last load
    if (!permissions) {
      this.logger.warn(
        `No permissions found for path: ${path} and method: ${method}`,
      );
      try {
        await this._loadPermissions();
      } catch {
        return false;
      }
      permissions = await this._getPermissionsFromKv(path, method);
      if (!permissions) {
        this.logger.error(
          `Permissions still not found after reload for path: ${path} and method: ${method}`,
        );
        return false;
      }
    }

    if (permissions.includes(userRole)) {
      return true;
    }

    return false;
  }

  async use(req: TypedRequest, res: Response, next: () => void) {
    // jwt middleware should have already run
    if (!req.locals.userRole) {
      this.logger.warn(
        'Permission middleware was called before JWT middleware',
      );
      return res.status(401).json({ message: 'Unauthorized' });
    }

    this.logger.debug(`User role: ${req.locals.userRole}`);
    this.logger.debug(`Request method: ${req.method}`);

    const isAllowed = await this._checkRoutePermissions(
      req.locals.userRole,
      this._reconstructPath(req.path),
      req.method,
    );

    if (!isAllowed) {
      this.logger.warn(
        `User with role ${req.locals.userId} is not authorized to access ${req.path} with method ${req.method}`,
      );
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  }
}
