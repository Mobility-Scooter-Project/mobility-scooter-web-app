import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { User } from '../user/user';
import { Video } from './video';

@Entity({ schema: SCHEMAS.VIDEOS })
export class VideoTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video, { nullable: false })
  video: Video;

  @Column({ type: 'double precision' })
  timestamp: number;

  @Column({ type: 'text' })
  task: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'double precision', nullable: true })
  score: number | null;

  // Null when the row was created by the video worker (model output)
  @ManyToOne(() => User, { nullable: true })
  createdByUser: User | null;

  // Set when a user last edited the row via the API (including edits to worker-created tasks).
  @ManyToOne(() => User, { nullable: true })
  updatedByUser: User | null;
}
