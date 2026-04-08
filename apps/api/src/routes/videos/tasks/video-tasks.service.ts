import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VideoTask } from '@infra/db/entity/video/task';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

export type VideoTaskEntry = {
  taskNumber: number;
  timestamp: number;
  task: string;
  note: string | null;
  score: number | null;
};

@Injectable()
export class VideoTasksService {
  constructor(
    @InjectRepository(VideoTask)
    private readonly videoTaskRepository: Repository<VideoTask>,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  public async getVideoTasks(
    userId: string,
    videoId: string,
  ): Promise<VideoTaskEntry[]> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    const row = await this.videoTaskRepository
      .createQueryBuilder('t')
      .innerJoin('t.video', 'v')
      .where('v.id = :videoId', { videoId })
      .getOne();

    // If task_detection hasn't completed yet, the row may not exist.
    // Return an empty list instead of 404 so the UI can poll gracefully.
    return (row?.tasks ?? []) as VideoTaskEntry[];
  }
}
