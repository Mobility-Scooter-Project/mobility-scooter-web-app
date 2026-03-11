import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  JoinColumn,
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

  @OneToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @OneToOne(() => Unit)
  @JoinColumn({ name: 'unitId' })
  unit: Unit;
}
