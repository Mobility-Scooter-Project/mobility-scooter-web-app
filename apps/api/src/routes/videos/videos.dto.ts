import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class VideoMetadataDto {
  /** Internal `Patient.id` from `POST .../sessions` (`patientId` in the response). */
  @IsUUID()
  patientId: string;

  @IsUUID()
  sessionId: string;

  @IsNotEmpty()
  fileName: string;
}

export class ReprocessVideoDto {
  @IsOptional()
  @IsArray()
  steps?: ('pose_estimation' | 'transcription' | 'task_detection')[];
}
