import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';

@Entity({ schema: SCHEMAS.VIDEOS })
@Unique(['video', 'frameIndex'])
export class Keypoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video)
  video: Video;

  @Column({
    type: 'int',
  })
  frameIndex: number;

  @Column({
    type: 'double precision',
  })
  timestamp: number;

  @Column({
    type: 'double precision',
  })
  angle: number;

  @Column({
    type: 'jsonb',
  })
  keypoints: Record<string, any>;
}
