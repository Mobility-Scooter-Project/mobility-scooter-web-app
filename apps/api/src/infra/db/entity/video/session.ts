import { SCHEMAS } from '@src/config/schemas';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Patient } from '../unit/patient';
import { Unit } from '../unit/unit';

@Entity({ schema: SCHEMAS.VIDEOS })
export class PatientSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @OneToOne(() => Patient, (patient) => patient.id)
  patient: Patient;

  @OneToOne(() => Unit, (unit) => unit.id)
  unit: Unit;
}
