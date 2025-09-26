import { Column } from 'typeorm';

export class CreateUpdateFields {
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * When a field contains this, it means it can be soft-deleted; this is important
 * if an org has particular data retention policies.
 */
export class CreateUpdateDeleteFields extends CreateUpdateFields {
  deletedAt?: Date | null;
}
