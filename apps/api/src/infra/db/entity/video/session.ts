import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { Patient } from '../unit/patient';
import { Unit } from '../unit/unit';

@Entity({ schema: SCHEMAS.VIDEOS })
export class PatientSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @Column({ type: 'date' })
  sessionDate: string;

  @Column({ type: 'time' })
  sessionTime: string;

  @ManyToOne(() => Patient, { nullable: false })
  patient: Patient;

  @ManyToOne(() => Unit, { nullable: false })
  unit: Unit;
}
