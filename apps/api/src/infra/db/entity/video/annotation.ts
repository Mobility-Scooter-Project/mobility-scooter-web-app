import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';
import { Assignment } from '../unit/assignment';

@Entity({ schema: SCHEMAS.VIDEOS })
export class VideoAnnotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Assignment)
  assignment: Assignment;

  @ManyToOne(() => Video)
  video: Video;

  @Column({ type: 'text' })
  targetType: 'keypoint' | 'task';

  @Column({ type: 'uuid', nullable: true })
  targetId: string; // ID of the keypoint or task being modified

  @Column({ type: 'jsonb' })
  changes: Record<string, any>; // the modified fields
}
