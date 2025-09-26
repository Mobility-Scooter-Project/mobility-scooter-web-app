import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { USER_ROLES } from '../user/enums';
import { CreateUpdateDeleteFields } from '../shared';
import { Unit } from './unit';
import { User } from '../user/user';

@Entity()
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

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @OneToOne(() => Unit, (unit) => unit.id)
  unit: Unit;

  @OneToOne(() => User, (user) => user.id)
  invitedBy: User;
}
