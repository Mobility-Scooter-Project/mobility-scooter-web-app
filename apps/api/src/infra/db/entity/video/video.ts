import { SCHEMAS } from '@src/config/schemas';
import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { PatientSession } from './session';
import { File } from '../unit/file';

@Entity({ schema: SCHEMAS.VIDEOS })
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => PatientSession, (session) => session.id)
  session: PatientSession;

  @OneToOne(() => File, (file) => file.id)
  file: File;
}
