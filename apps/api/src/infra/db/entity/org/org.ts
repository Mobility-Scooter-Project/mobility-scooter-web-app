import { SCHEMAS } from "@src/config/schemas";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Application } from "./application";
import { CreateUpdateDeleteFields } from "../shared";
import { Department } from "./department";

@Entity({ schema: SCHEMAS.ORGS })
export class Org {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'varchar',
        length: 255,
    })
    name: string

    /**
     * Here we link to the application that was used to create this org.
     * Not every application will result in an org, but every org must have had an application.
     */
    @OneToOne(() => Application)
    @JoinColumn()
    application: Application

    @Column({
        type: 'varchar',
        length: 255,
    })
    location: string

    @Column(() => CreateUpdateDeleteFields)
    cud: CreateUpdateDeleteFields

    @OneToMany(() => Department, department => department.org)
    departments: Department[]
}