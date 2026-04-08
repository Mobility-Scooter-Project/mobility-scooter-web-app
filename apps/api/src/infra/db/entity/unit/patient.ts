import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Unit } from './unit';

@Entity({ schema: SCHEMAS.UNITS })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({
    type: 'int',
    default: 0,
  })
  age: number;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'unknown',
  })
  gender: string;

  @Column({
    type: 'jsonb',
    default: '{}',
  })
  notes: string;

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
  })
  patientId: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => Unit, { nullable: false })
  @JoinColumn()
  unit: Unit;
}
