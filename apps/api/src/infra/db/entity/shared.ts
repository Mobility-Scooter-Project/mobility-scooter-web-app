import { Column } from 'typeorm';

export class CreateUpdateFields {
  @Column({ type: 'timestamp', default: () => 'now()' })
  createdAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt?: Date;
}

/**
 * When a field contains this, it means it can be soft-deleted; this is important
 * if an org has particular data retention policies.
 */
export class CreateUpdateDeleteFields extends CreateUpdateFields {
  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date | null;
}
