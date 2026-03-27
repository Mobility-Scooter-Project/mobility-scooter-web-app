import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
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

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  uploadedBy: User;

  @OneToOne(() => Unit, { nullable: false })
  @JoinColumn()
  unit: Unit;
}
