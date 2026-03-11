import { Column } from 'typeorm';

export class CreateUpdateFields {
  // NOTE: migrations created embedded columns as `cuCreatedat` / `cuUpdatedat`
  // Explicit names keep entity metadata aligned with DB.
  @Column({ type: 'timestamp', name: 'Createdat', default: () => 'now()' })
  createdAt?: Date;

  @Column({ type: 'timestamp', name: 'Updatedat', nullable: true })
  updatedAt?: Date;
}

/**
 * When a field contains this, it means it can be soft-deleted; this is important
 * if an org has particular data retention policies.
 */
export class CreateUpdateDeleteFields extends CreateUpdateFields {
  @Column({ type: 'timestamp', name: 'Deletedat', nullable: true })
  deletedAt?: Date | null;
}
