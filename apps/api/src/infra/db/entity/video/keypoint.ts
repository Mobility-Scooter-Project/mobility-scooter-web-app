import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';
import { Assignment } from '../unit/assignment';

@Entity({ schema: SCHEMAS.VIDEOS })
export class Keypoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @Column({
    type: 'jsonb',
  })
  data: Record<string, any>;

  @ManyToOne(() => Video, (video) => video.id)
  video: Video;

  @ManyToOne(() => Assignment, (assignment) => assignment.id)
  assignment: Assignment;
}
