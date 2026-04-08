import {
  Controller,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Req,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { TypedRequest } from '@config/request';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoWorkerSseService } from './video-worker-sse.service';

@Controller('video-worker')
export class VideoWorkerSseController {
  constructor(
    private readonly videoWorkerSseService: VideoWorkerSseService,
    private readonly videoAuthorizationService: VideoAuthorizationService,
  ) {}

  /**
   * Server-Sent Events stream for worker status updates (step completion, overall completion).
   * Open after upload/reprocess. Pair with an initial `GET …/status` to render the current snapshot,
   * because SSE only delivers *new* events after the connection is established (past events are not replayed;
   * reconnects will also miss earlier updates).
   *
   * Could consume SSE events using raw fetch and ReadableStream
   */
  @SkipThrottle()
  @Sse(':videoId/worker-events')
  streamWorkerEvents(
    @Req() req: TypedRequest,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ): Observable<MessageEvent> {
    const userId = req.locals.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return from(
      this.videoAuthorizationService.assertUserCanAccessVideo(userId, videoId),
    ).pipe(
      switchMap(() =>
        this.videoWorkerSseService.streamForVideo(videoId),
      ),
    );
  }
}

