import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@infra/db/entity/user/user';
import { VideoTask } from '@infra/db/entity/video/task';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

import { CreateVideoTaskDto, UpdateVideoTaskDto } from './video-tasks.dto';

const taskRelations = { createdByUser: true, updatedByUser: true } as const;

type VideoTaskEntry = {
  taskId: string;
  timestamp: number;
  task: string;
  note: string | null;
  score: number | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
};

@Injectable()
export class VideoTasksService {
  private logger = new Logger(VideoTasksService.name);

  constructor(
    @InjectRepository(VideoTask)
    private readonly videoTaskRepository: Repository<VideoTask>,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  private toEntry(row: VideoTask): VideoTaskEntry {
    const createdByUserId = row.createdByUser?.id ?? null;
    return {
      taskId: row.id,
      timestamp: row.timestamp,
      task: row.task,
      note: row.note,
      score: row.score,
      createdByUserId,
      updatedByUserId: row.updatedByUser?.id ?? null,
    };
  }

  public async getVideoTasks(
    userId: string,
    videoId: string,
  ): Promise<VideoTaskEntry[]> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    let rows: VideoTask[];
    try {
      rows = await this.videoTaskRepository.find({
        where: { video: { id: videoId } },
        order: { timestamp: 'ASC', id: 'ASC' },
        relations: taskRelations,
      });
    } catch (error) {
      this.logger.error('Failed to list video_task rows', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return rows.map((r) => this.toEntry(r));
  }

  public async createVideoTask(
    userId: string,
    videoId: string,
    dto: CreateVideoTaskDto,
  ): Promise<VideoTaskEntry> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    let saved: VideoTask;
    try {
      const row = this.videoTaskRepository.create({
        video: { id: videoId },
        timestamp: dto.timestamp,
        task: dto.task,
        note: dto.note ?? null,
        score: dto.score ?? null,
        createdByUser: { id: userId },
        updatedByUser: null,
      });
      saved = await this.videoTaskRepository.save(row);
    } catch (error) {
      this.logger.error('Failed to create video_task row', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const full = await this.videoTaskRepository.findOneOrFail({
      where: { id: saved.id },
      relations: taskRelations,
    });
    return this.toEntry(full);
  }

  public async updateVideoTask(
    userId: string,
    videoId: string,
    taskId: string,
    dto: UpdateVideoTaskDto,
  ): Promise<VideoTaskEntry> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    let row: VideoTask | null;
    try {
      row = await this.videoTaskRepository.findOne({
        where: { id: taskId, video: { id: videoId } },
        relations: taskRelations,
      });
    } catch (error) {
      this.logger.error('Failed to load video_task for update', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!row) {
      throw new HttpException('Video task not found', HttpStatus.NOT_FOUND);
    }

    if (dto.timestamp !== undefined) row.timestamp = dto.timestamp;
    if (dto.task !== undefined) row.task = dto.task;
    if (dto.note !== undefined) row.note = dto.note;
    if (dto.score !== undefined) row.score = dto.score;
    row.updatedByUser = { id: userId } as User;

    let saved: VideoTask;
    try {
      saved = await this.videoTaskRepository.save(row);
    } catch (error) {
      this.logger.error('Failed to update video_task row', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const full = await this.videoTaskRepository.findOneOrFail({
      where: { id: saved.id },
      relations: taskRelations,
    });
    return this.toEntry(full);
  }

  public async deleteVideoTask(
    userId: string,
    videoId: string,
    taskId: string,
  ): Promise<{ deleted: true }> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(
      userId,
      videoId,
    );

    let result: { affected?: number | null };
    try {
      result = await this.videoTaskRepository.delete({
        id: taskId,
        video: { id: videoId },
      });
    } catch (error) {
      this.logger.error('Failed to delete video_task row', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!result.affected) {
      throw new HttpException('Video task not found', HttpStatus.NOT_FOUND);
    }

    return { deleted: true };
  }
}
