import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
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

  @ManyToOne(() => User, { nullable: false })
  uploadedBy: User;

  @ManyToOne(() => Unit, { nullable: false })
  unit: Unit;
}
