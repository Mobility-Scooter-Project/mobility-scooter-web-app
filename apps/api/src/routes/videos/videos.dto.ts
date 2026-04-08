import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class VideoMetadataDto {
  @IsUUID()
  patientUuid: string;

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
