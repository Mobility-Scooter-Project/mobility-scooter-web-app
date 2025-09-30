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

@Injectable()
export class PermissionsMiddleware implements NestMiddleware {
  private logger = new Logger(PermissionsMiddleware.name);
  private kv: Redis;

  constructor(
    @InjectRepository(RoutePermissions)
    private readonly routePermissionsRepository: any,
    private readonly KvService: KvService,
  ) {
    this.kv = this.KvService.kv;
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
        await this.KvService.loadPermissions();
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

    // when permissions are updated, they are automatically updated by
    // TypeORM
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
    this.logger.debug(`Request path: ${req.path}`);
    this.logger.debug(`Request method: ${req.method}`);

    const isAllowed = await this._checkRoutePermissions(
      req.locals.userRole,
      req.path,
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
