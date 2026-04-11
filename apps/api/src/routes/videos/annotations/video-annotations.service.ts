import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VideoAnnotation } from '@infra/db/entity/video/annotation';
import { User } from '@infra/db/entity/user/user';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoAnnotationDto } from './video-annotations.dto';

const annotationRelations = { createdByUser: true, updatedByUser: true } as const;

type VideoAnnotationOutput = {
  annotationId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  title: string;
  description: string;
  startTime: number;
  endTime: number | null;
};

@Injectable()
export class VideoAnnotationsService {
  private logger = new Logger(VideoAnnotationsService.name);

  constructor(
    @InjectRepository(VideoAnnotation)
    private readonly annotationRepository: Repository<VideoAnnotation>,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  /**
   * Converts a VideoAnnotation entity to a VideoAnnotationOutput object.
   * @param row - The VideoAnnotation entity to convert.
   * @returns The VideoAnnotationOutput object.
   */
  private toOutput(row: VideoAnnotation): VideoAnnotationOutput {
    return {
      annotationId: row.id,
      createdByUserId: row.createdByUser.id,
      updatedByUserId: row.updatedByUser?.id ?? null,
      title: row.title,
      description: row.description,
      startTime: row.startTime,
      endTime: row.endTime,
    };
  }

  private assertValidTimeRange(dto: Pick<VideoAnnotationDto, 'startTime' | 'endTime'>) {
    if (dto.endTime == null) return;
    if (dto.endTime < dto.startTime) {
      throw new HttpException(
        'endTime must be null or greater than or equal to startTime',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Creates a new video annotation.
   * @param userId - The ID of the user creating the annotation.
   * @param videoId - The ID of the video to create the annotation for.
   * @param dto - The VideoAnnotationDto object containing the annotation data.
   * @returns The VideoAnnotationOutput object.
   */
  public async createAnnotation(
    userId: string,
    videoId: string,
    dto: VideoAnnotationDto,
  ): Promise<VideoAnnotationOutput> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId);
    this.assertValidTimeRange(dto);

    let saved: VideoAnnotation;
    try {
      const entity = this.annotationRepository.create({
        video: { id: videoId },
        createdByUser: { id: userId },
        updatedByUser: null,
        title: dto.title,
        description: dto.description,
        startTime: dto.startTime,
        endTime: dto.endTime ?? null,
      });
      saved = await this.annotationRepository.save(entity);
    } catch (error) {
      this.logger.error('Failed to create video annotation', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let withUser: VideoAnnotation | null;
    try {
      withUser = await this.annotationRepository.findOne({
        where: { id: saved.id },
        relations: annotationRelations,
      });
    } catch (error) {
      this.logger.error('Failed to load annotation after create', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    if (!withUser) {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.toOutput(withUser);
  }

  /**
   * Gets all video annotations for a video (all creators; unit collaborators who can access the video).
   * @param userId - The ID of the user getting the annotations.
   * @param videoId - The ID of the video to get the annotations for.
   * @returns The VideoAnnotationOutput objects.
   */
  public async getAnnotations(
    userId: string,
    videoId: string,
  ): Promise<VideoAnnotationOutput[]> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId);

    let rows: VideoAnnotation[];
    try {
      rows = await this.annotationRepository.find({
        where: { video: { id: videoId } },
        relations: annotationRelations,
        order: { startTime: 'ASC', cu: { createdAt: 'ASC' } },
      });
    } catch (error) {
      this.logger.error('Failed to list video annotations', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return rows.map((row) => this.toOutput(row));
  }

  /**
   * Gets a single video annotation.
   * @param userId - The ID of the user getting the annotation.
   * @param videoId - The ID of the video to get the annotation for.
   * @param annotationId - The ID of the annotation to get.
   * @returns The VideoAnnotationOutput object.
   */
  public async getAnnotation(
    userId: string,
    videoId: string,
    annotationId: string,
  ): Promise<VideoAnnotationOutput> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId);

    let row: VideoAnnotation | null;
    try {
      row = await this.annotationRepository.findOne({
        where: { id: annotationId, video: { id: videoId } },
        relations: annotationRelations,
      });
    } catch (error) {
      this.logger.error('Failed to fetch video annotation', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!row) {
      throw new HttpException('Annotation not found', HttpStatus.NOT_FOUND);
    }

    return this.toOutput(row);
  }

  /**
   * Updates a video annotation. Policy: any user in the unit who can access the video (same as other video routes).
   * TODO: may restrict to creator + lead once role rules are defined.
   * @param userId - The ID of the user updating the annotation.
   * @param videoId - The ID of the video to update the annotation for.
   * @param annotationId - The ID of the annotation to update.
   * @param dto - The VideoAnnotationDto object containing the annotation data.
   * @returns The VideoAnnotationOutput object.
   */
  public async updateAnnotation(
    userId: string,
    videoId: string,
    annotationId: string,
    dto: VideoAnnotationDto,
  ): Promise<VideoAnnotationOutput> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId);
    this.assertValidTimeRange(dto);

    let existing: VideoAnnotation | null;
    try {
      existing = await this.annotationRepository.findOne({
        where: { id: annotationId, video: { id: videoId } },
        relations: annotationRelations,
      });
    } catch (error) {
      this.logger.error('Failed to fetch video annotation for update', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!existing) {
      throw new HttpException('Annotation not found', HttpStatus.NOT_FOUND);
    }

    existing.description = dto.description;
    existing.title = dto.title;
    existing.startTime = dto.startTime;
    existing.endTime = dto.endTime ?? null;
    existing.updatedByUser = { id: userId } as User;

    try {
      await this.annotationRepository.save(existing);
    } catch (error) {
      this.logger.error('Failed to update video annotation', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const refreshed = await this.annotationRepository.findOneOrFail({
      where: { id: annotationId, video: { id: videoId } },
      relations: annotationRelations,
    });
    return this.toOutput(refreshed);
  }

  /**
   * Deletes a video annotation. Policy: any user in the unit who can access the video.
   * TODO: may align with update policy (e.g. creator + lead) when roles are defined.
   * @param userId - The ID of the user deleting the annotation.
   * @param videoId - The ID of the video to delete the annotation for.
   * @param annotationId - The ID of the annotation to delete.
   * @returns The VideoAnnotationOutput object.
   */
  public async deleteAnnotation(
    userId: string,
    videoId: string,
    annotationId: string,
  ): Promise<{ deleted: true }> {
    await this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId);

    let result: { affected?: number | null };
    try {
      result = await this.annotationRepository.delete({
        id: annotationId,
        video: { id: videoId },
      });
    } catch (error) {
      this.logger.error('Failed to delete video annotation', error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!result.affected) {
      throw new HttpException('Annotation not found', HttpStatus.NOT_FOUND);
    }

    return { deleted: true };
  }
}

