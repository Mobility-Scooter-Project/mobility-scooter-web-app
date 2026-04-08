import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class VideoAnnotationDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  endTime?: number | null;
}

