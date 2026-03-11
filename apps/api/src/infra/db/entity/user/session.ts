import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateUpdateDeleteFields } from '../shared';
import { UserIdentity } from './identity';

@Entity({ schema: SCHEMAS.USERS })
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => UserIdentity, { nullable: false })
  identity: UserIdentity;
}
