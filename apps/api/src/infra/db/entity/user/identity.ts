import { SCHEMAS } from "@src/config/schemas";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IDENTITY_PROVIDERS } from "./enums";
import { CreateUpdateDeleteFields } from "../shared";

@Entity({ schema: SCHEMAS.USERS })
export class UserIdentity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'enum',
        enum: IDENTITY_PROVIDERS,
        default: IDENTITY_PROVIDERS.email
    })
    provider: IDENTITY_PROVIDERS

    @Column({
        type: 'jsonb',
        nullable: true
    })
    providerData: any

    @Column(() => CreateUpdateDeleteFields)
    cud: CreateUpdateDeleteFields
}