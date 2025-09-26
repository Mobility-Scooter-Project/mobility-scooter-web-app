import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Unit } from './unit';

@Entity({ schema: SCHEMAS.UNITS })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'int',
  })
  age: number;

  @Column({
    type: 'varchar',
    length: 10,
  })
  gender: string;

  @Column({
    type: 'jsonb',
  })
  notes: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @OneToOne(() => Unit, (unit) => unit.id)
  unit: Unit;
}
