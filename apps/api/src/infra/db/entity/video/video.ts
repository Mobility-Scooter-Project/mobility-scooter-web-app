import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  JoinColumn,
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

  @ManyToOne(() => PatientSession, { nullable: false })
  session: PatientSession;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @OneToOne(() => File, { nullable: false })
  @JoinColumn()
  file: File;
}
