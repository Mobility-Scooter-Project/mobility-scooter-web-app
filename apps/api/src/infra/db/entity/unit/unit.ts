import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Department } from '../org/department';

@Entity({ schema: SCHEMAS.UNITS })
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => Department, (department) => department.id)
  department: Department;
}
