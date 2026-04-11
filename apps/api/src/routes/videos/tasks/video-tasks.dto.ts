import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateVideoTaskDto {
  @IsNumber()
  timestamp: number;

  @IsString()
  @MaxLength(10_000)
  task: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsNumber()
  score?: number | null;
}

export class UpdateVideoTaskDto {
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsNumber()
  score?: number | null;
}
