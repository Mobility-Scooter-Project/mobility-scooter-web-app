import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { INVITE_STATUS, USER_ROLES } from '@config/enums';
import { CreateUpdateDeleteFields } from '../shared';
import { Unit } from './unit';
import { User } from '../user/user';
import { SCHEMAS } from '@config/schemas';

@Entity({ schema: SCHEMAS.UNITS })
export class UnitInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: USER_ROLES,
  })
  role: USER_ROLES;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @Column({
    type: 'text',
  })
  invite_url: string;

  @Column({
    type: 'enum',
    enum: INVITE_STATUS,
    default: INVITE_STATUS.PENDING,
  })
  status: INVITE_STATUS;

  @Column({
    type: 'varchar',
    length: 255,
  })
  inviteeEmail: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => Unit, { nullable: false })
  @JoinColumn()
  unit: Unit;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  invitedBy: User;
}
