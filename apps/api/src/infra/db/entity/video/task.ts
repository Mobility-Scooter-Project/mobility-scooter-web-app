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
@Unique(['video'])
export class VideoTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video)
  video: Video;

  @Column({ type: 'jsonb' })
  tasks: Record<string, any>[];
}
