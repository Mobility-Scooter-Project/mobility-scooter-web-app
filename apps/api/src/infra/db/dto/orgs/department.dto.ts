import { SCHEMAS } from "@src/config/schemas";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrgMetadata } from "./metadata.dto";

@Entity({ schema: SCHEMAS.ORGS })
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => OrgMetadata, org => org.id)
    org: OrgMetadata
}