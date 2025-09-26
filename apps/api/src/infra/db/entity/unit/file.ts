import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { User } from '../user/user';
import { Unit } from './unit';

@Entity({ schema: SCHEMAS.UNITS })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'text',
  })
  path: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @OneToOne(() => User, (user) => user.id)
  uploadedBy: User;

  @OneToOne(() => Unit, (unit) => unit.id)
  unit: Unit;
}
