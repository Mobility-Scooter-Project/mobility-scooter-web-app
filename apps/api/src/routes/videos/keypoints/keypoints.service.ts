import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keypoint } from '@infra/db/entity/video/keypoint';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

type KeypointRow = {
  frameIndex: number;
  timestamp: number;
  angle: number;
  keypoints: Record<string, unknown>;
};

// Number of frames to fetch since the last frame, 200 frames is approximately 40 seconds.
const DEFAULT_SINCE_LIMIT = 200;
// Nearest keypoint must be within this time distance of the requested timestamp.
const DEFAULT_MAX_DELTA_SECONDS = 1;

@Injectable()
export class KeypointsService {
  constructor(
    @InjectRepository(Keypoint)
    private readonly keypointRepository: Repository<Keypoint>,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  private toDto(row: Keypoint): KeypointRow {
    return {
      frameIndex: row.frameIndex,
      timestamp: row.timestamp,
      angle: row.angle,
      keypoints: row.keypoints,
    };
  }

  /**
   * Get keypoints since the given frame index.
   * @param userId - The ID of the user requesting the keypoints
   * @param videoId - The ID of the video to get the keypoints for
   * @param afterFrameIndex - The frame index to start from
   * @param limit - The maximum number of keypoints to return
   * @returns The keypoints rows
   * @throws HttpException if the limit is less than 1
   */
  public async getSince(
    userId: string,
    videoId: string,
    afterFrameIndex: number,
    limit: number,
  ): Promise<{ items: KeypointRow[] }> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    const take = Math.min(Math.max(1, limit), DEFAULT_SINCE_LIMIT);

    const rows = await this.keypointRepository
      .createQueryBuilder('k')
      .innerJoin('k.video', 'v')
      .where('v.id = :videoId', { videoId })
      .andWhere('k.frameIndex > :after', { after: afterFrameIndex })
      .orderBy('k.frameIndex', 'ASC')
      .take(take)
      .getMany();

    return { items: rows.map((r) => this.toDto(r)) };
  }

  /**
   * Get the closest keypoint by time to the requested timestamp.
   * @param userId - The ID of the user requesting the keypoint
   * @param videoId - The ID of the video to get the keypoint for
   * @param timestamp - The timestamp to get the closest keypoint for
   * @param maxDeltaSeconds - The maximum allowed difference between the requested timestamp and the keypoint timestamp
   * @returns The closest keypoint row or null if no keypoint is found
   * @throws HttpException if the maxDeltaSeconds is less than 0
   */
  public async getNearest(
    userId: string,
    videoId: string,
    timestamp: number,
    maxDeltaSeconds: number,
  ): Promise<KeypointRow | null> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    if (maxDeltaSeconds < 0) {
      throw new HttpException(
        'maxDeltaSeconds must be >= 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const row = await this.keypointRepository
      .createQueryBuilder('k')
      .innerJoin('k.video', 'v')
      .where('v.id = :videoId', { videoId })
      // Select then order by alias
      .addSelect('ABS(k.timestamp - :ts)', 'ts_dist')
      .orderBy('ts_dist', 'ASC')
      .addOrderBy('k.frameIndex', 'ASC')
      .setParameter('ts', timestamp)
      .take(1)
      .getOne();

    if (!row) {
      return null;
    }

    const delta = Math.abs(row.timestamp - timestamp);
    if (delta > maxDeltaSeconds) {
      return null;
    }

    return this.toDto(row);
  }
}

export { DEFAULT_MAX_DELTA_SECONDS, DEFAULT_SINCE_LIMIT };
