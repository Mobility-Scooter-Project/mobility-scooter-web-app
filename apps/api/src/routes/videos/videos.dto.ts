import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class VideoMetadataDto {
  @IsUUID()
  patientUuid: string;

  @IsUUID()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class UpdateVideoTitleDto {
  @IsString()
  @MaxLength(255)
  title: string;
}

export class ReprocessVideoDto {
  @IsOptional()
  @IsArray()
  steps?: ('pose_estimation' | 'transcription' | 'task_detection')[];
}
