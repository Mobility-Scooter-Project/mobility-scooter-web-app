import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { APPLICATION_STATUS } from './enums';
import { CreateUpdateDeleteFields } from '../shared';

@Entity({ schema: SCHEMAS.ORGS })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: APPLICATION_STATUS,
    default: APPLICATION_STATUS.PENDING,
  })
  status: APPLICATION_STATUS;

  /**
   * This is the ID/name of the moderator who last updated the status
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  statusUpdatedBy: string;

  @Column({
    type: 'text',
  })
  statusMessage: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;
}
