import { SCHEMAS } from '@config/schemas';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from '../video/video';
import { VideoWorkerEvent } from './event';

@Entity({ schema: SCHEMAS.VIDEO_WORKER, name: 'status' })
export class VideoWorkerStatus {
  @PrimaryColumn('uuid')
  videoId: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @OneToOne(() => Video, { nullable: false })
  @JoinColumn()
  video: Video;

  @OneToOne(() => VideoWorkerEvent, { nullable: false })
  @JoinColumn()
  statusEvent: VideoWorkerEvent;

  @Column({ type: 'double precision', nullable: true })
  durationSec: number | null;
}
