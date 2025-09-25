import { SCHEMAS } from "@src/config/schemas";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CreateUpdateFields } from "../shared";
import { Video } from "./video";

@Entity({ schema: SCHEMAS.VIDEOS })
export class VideoLabel {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        type: 'jsonb'
    })
    data: Record<string, any>

    @Column(() => CreateUpdateFields)
    cu: CreateUpdateFields

    @ManyToOne(() => Video, (video) => video.id)
    video: Video
}