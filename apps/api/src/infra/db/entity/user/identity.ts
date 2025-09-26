import { SCHEMAS } from '@config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IDENTITY_PROVIDERS } from './enums';
import { CreateUpdateDeleteFields } from '../shared';
import { User } from './user';

@Entity({ schema: SCHEMAS.USERS })
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: IDENTITY_PROVIDERS,
    default: IDENTITY_PROVIDERS.EMAIL,
  })
  provider: IDENTITY_PROVIDERS;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  providerData: any;

  @Column(() => CreateUpdateDeleteFields)
  cud: CreateUpdateDeleteFields;

  @ManyToOne(() => User, (user) => user.id)
  user: User;
}
