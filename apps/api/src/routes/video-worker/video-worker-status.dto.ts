import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  VIDEO_WORKER_OVERALL_STATUS,
  VIDEO_WORKER_STEP_STATUS,
  VIDEO_WORKER_STEPS,
} from '@config/enums';

/** Webhook body when overall video processing reaches a terminal DB state. */
export class VideoWorkerStatusDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsNumber()
  @Min(0)
  durationSec: number;

  /** Terminal overall status after worker commits `video_worker.status` (Kafka always sends this). */
  @IsEnum(VIDEO_WORKER_OVERALL_STATUS)
  overallStatus: VIDEO_WORKER_OVERALL_STATUS;
}

/** Webhook body when a pipeline step reaches a terminal DB state (completed or failed after retries). */
export class VideoWorkerStepStatusDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsEnum(VIDEO_WORKER_STEPS)
  step: VIDEO_WORKER_STEPS;

  @IsEnum(VIDEO_WORKER_STEP_STATUS)
  status: VIDEO_WORKER_STEP_STATUS;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSec?: number;

  @IsInt()
  @Min(1)
  attempts: number;

  @ValidateIf((o) => o.status === VIDEO_WORKER_STEP_STATUS.FAILED)
  @IsString()
  @IsNotEmpty()
  lastError?: string;
}
