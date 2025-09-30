import { HTTP_METHODS, USER_ROLES } from '@config/enums';
import { SCHEMAS } from '@config/schemas';
import { KvService } from '@infra/kv/kv.service';
import { Logger } from '@nestjs/common';
import {
  AfterUpdate,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  type UpdateEvent,
} from 'typeorm';

@Index(['route', 'method', 'role'], { unique: true })
@Entity({ schema: SCHEMAS.USERS })
export class RoutePermissions {
  private logger = new Logger(RoutePermissions.name);

  constructor(private readonly KVService: KvService) {}

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  route: string;

  @Column({ type: 'enum', enum: HTTP_METHODS })
  method: HTTP_METHODS;

  @Column({
    type: 'enum',
    enum: USER_ROLES,
    array: true,
  })
  role: USER_ROLES[];

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @AfterUpdate()
  async reloadPermissions(event: UpdateEvent<RoutePermissions>) {
    if (!event.entity) {
      this.logger.warn('No entity found in UpdateEvent');
      return;
    }
    const entity = event.entity as Partial<RoutePermissions>;

    try {
      const kv = this.KVService.kv;
      if (entity.route && entity.method && entity.role) {
        await kv.hset(
          `user_permissions:${entity.route}`,
          entity.method,
          entity.role.join(','),
        );
        this.logger.log(
          `Updated permissions in KV for route: ${entity.route}, method: ${entity.method}`,
        );
      }
    } catch (error) {
      this.logger.error('Error reloading permissions in KV', error);
    }
  }
}
