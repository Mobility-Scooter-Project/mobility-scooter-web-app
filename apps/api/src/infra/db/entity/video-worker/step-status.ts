import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from '../video/video';

@Entity({ schema: SCHEMAS.VIDEO_WORKER, name: 'step_status' })
export class VideoWorkerStepStatus {
  @PrimaryColumn('uuid')
  videoId: string;

  @PrimaryColumn({ type: 'text' })
  step: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video)
  @JoinColumn({ name: 'videoId' })
  video: Video;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;
}
