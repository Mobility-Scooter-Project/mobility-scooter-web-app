import { IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';

export class VideoMetadataDto {
  @IsNotEmpty()
  patientId: string;
  @IsNotEmpty()
  sessionId: string;
  @IsNotEmpty()
  fileName: string;
}

export class ReprocessVideoDto {
  @IsOptional()
  @IsArray()
  steps?: ('pose_estimation' | 'transcription' | 'task_detection')[];
}
