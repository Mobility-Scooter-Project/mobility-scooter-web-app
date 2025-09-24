import { IsNotEmpty } from "class-validator";

export class VideoMetadataDto {
    @IsNotEmpty()
    patientId: string;
    @IsNotEmpty()
    sessionId: string
    @IsNotEmpty()
    fileName: string;
}