import { SCHEMAS } from "@src/config/schemas";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Org } from "./org";
import { Unit } from "../unit/unit";

@Entity({ schema: SCHEMAS.ORGS })
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => Org, org => org.id)
    org: Org
}