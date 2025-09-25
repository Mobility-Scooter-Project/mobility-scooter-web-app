import { SCHEMAS } from "@src/config/schemas";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CreateUpdateFields } from "../shared";
import { UserSession } from "./session";

@Entity({ schema: SCHEMAS.USERS })
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'text'
    })
    token: string

    @Column({
        type: 'timestamp'
    })
    expiresAt: Date

    @Column(() => CreateUpdateFields)
    cu: CreateUpdateFields

    @ManyToOne(() => UserSession, (session) => session.id, { nullable: false })
    session: UserSession
}