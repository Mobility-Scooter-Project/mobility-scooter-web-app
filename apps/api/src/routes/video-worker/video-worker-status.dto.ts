import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import {
  VIDEO_WORKER_OVERALL_STATUS,
  VIDEO_WORKER_COMPLETED_STEPS,
} from '@config/enums';

export class VideoWorkerCompletedDto {
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

// Webhook payload when `pose_estimation` or `task_detection` completes successfully (no `failed` path).
export class VideoWorkerStepCompletedDto {
  @IsNotEmpty()
  @IsUUID()
  videoId: string;

  @IsEnum(VIDEO_WORKER_COMPLETED_STEPS)
  step: VIDEO_WORKER_COMPLETED_STEPS;

  @IsNumber()
  @Min(0)
  durationSec: number;
}
