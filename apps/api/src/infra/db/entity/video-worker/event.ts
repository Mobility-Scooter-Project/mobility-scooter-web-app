import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from '../video/video';

@Entity({ schema: SCHEMAS.VIDEO_WORKER, name: 'event' })
export class VideoWorkerEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video, (video) => video.id)
  video: Video;

  @Column({ type: 'text' })
  step: string;

  @Column({ type: 'text' })
  status: string;
}
