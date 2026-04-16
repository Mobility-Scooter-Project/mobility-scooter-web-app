import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateFields } from '../shared';
import { Video } from './video';

@Entity({ schema: SCHEMAS.VIDEOS, name: 'stability' })
export class Stability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateFields)
  cu: CreateUpdateFields;

  @ManyToOne(() => Video, { nullable: false })
  video: Video;

  @Column({ type: 'int' })
  startFrame: number;

  @Column({ type: 'int' })
  endFrame: number;

  @Column({ type: 'double precision' })
  startTime: number;

  @Column({ type: 'double precision' })
  endTime: number;

  @Column({ type: 'int' })
  predictedClass: number;

  @Column({ type: 'double precision' })
  confidence: number;

}
