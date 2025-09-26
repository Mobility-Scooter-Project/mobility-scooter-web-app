import { SCHEMAS } from '@src/config/schemas';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Department } from '../org/department';

@Entity({ schema: SCHEMAS.UNITS })
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => Department, (department) => department.id)
  department: Department;
}
