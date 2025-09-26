import { SCHEMAS } from '@src/config/schemas';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Org } from './org';

@Entity({ schema: SCHEMAS.ORGS })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @ManyToOne(() => Org, (org) => org.id)
  org: Org;
}
