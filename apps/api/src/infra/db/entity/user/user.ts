import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { USER_ROLES } from './enums';
import { CreateUpdateDeleteFields } from '../shared';
import { Unit } from '../unit/unit';

@Entity({ schema: SCHEMAS.USERS })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  givenName: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  surname: string;

  @Column({
    type: 'enum',
    enum: USER_ROLES,
  })
  role: USER_ROLES;

  @Column({
    type: 'varchar',
    length: 255,
  })
  passwordHash: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => Unit, (unit) => unit.id)
  unit: Unit;
}
