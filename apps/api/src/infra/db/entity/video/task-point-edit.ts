import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';
import { Assignment } from '../unit/assignment';
import { User } from '../user/user';

@Entity({ schema: SCHEMAS.VIDEOS })
export class TaskPointEdit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Assignment, { nullable: false })
  assignment: Assignment;

  @ManyToOne(() => Video, { nullable: false })
  video: Video;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'text' })
  targetType: 'keypoint' | 'task';

  // Selector to locate the edited output (e.g. { frameIndex, keypointName } or { taskNumber }).
  @Column({ type: 'jsonb' })
  targetRef: Record<string, unknown>;

  // User patch payload applied to the selected output.
  @Column({ type: 'jsonb' })
  changes: Record<string, unknown>;
}
