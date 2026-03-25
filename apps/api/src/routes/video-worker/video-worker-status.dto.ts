import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class VideoWorkerCompletedDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSec?: number;
}
