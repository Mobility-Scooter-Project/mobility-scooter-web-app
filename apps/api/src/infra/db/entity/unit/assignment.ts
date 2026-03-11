import { SCHEMAS } from '@config/schemas';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { PatientSession } from '../video/session';
import { User } from '../user/user';
import { ASSIGNMENT_STATUS } from '@config/enums';

@Entity({ schema: SCHEMAS.UNITS })
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'timestamp',
  })
  dueBy: Date;

  @Column({
    type: 'enum',
    enum: ASSIGNMENT_STATUS,
    default: ASSIGNMENT_STATUS.TODO,
  })
  status: ASSIGNMENT_STATUS;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @OneToOne(() => PatientSession)
  @JoinColumn({ name: 'sessionId' })
  session: PatientSession;

  @OneToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @OneToOne(() => User)
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;
}
