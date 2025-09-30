import { HTTP_METHODS, USER_ROLES } from '@config/enums';
import { SCHEMAS } from '@config/schemas';
import { KvService } from '@infra/kv/kv.service';
import {
  AfterUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  type UpdateEvent,
} from 'typeorm';

@Entity({ schema: SCHEMAS.USERS })
export class RoutePermissions {
  constructor(private readonly KvService: KvService) {}

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
    await this.KvService.loadPermissions();
  }
}
