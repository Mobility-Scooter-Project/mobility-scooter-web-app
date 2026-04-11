import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { User } from '../user/user';
import { Video } from './video';

@Entity({ schema: SCHEMAS.VIDEOS })
export class VideoAnnotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video, { nullable: false })
  video: Video;

  @ManyToOne(() => User, { nullable: false })
  createdByUser: User;

  @ManyToOne(() => User, { nullable: true })
  updatedByUser: User | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'double precision' })
  startTime: number;

  @Column({ type: 'double precision', nullable: true })
  endTime: number | null;
}
