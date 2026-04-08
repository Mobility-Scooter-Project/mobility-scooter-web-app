import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';
import { User } from '../user/user';

@Entity({ schema: SCHEMAS.VIDEOS })
export class VideoAnnotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video, { nullable: false })
  video: Video;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'double precision' })
  startTime: number;

  @Column({ type: 'double precision', nullable: true })
  endTime: number | null;
}
