import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeWhile } from 'rxjs/operators';
import Redis from 'ioredis';
import { KvService } from '@infra/kv/kv.service';
import { VIDEO_WORKER_OVERALL_STATUS } from '@config/enums';

type VideoWorkerSsePayload =
  | {
      type: 'step';
      videoId: string;
      step: string;
      status: string | null;
      durationSec: number | null;
      attempts: number;
      lastError: string | null;
    }
  | {
      type: 'overall';
      videoId: string;
      overallStatus: string | null;
      durationSec: number | null;
    };

// Redis pub/sub: fan-out worker processing status to all API instances (distinct from DB `video_worker.event`).
const REDIS_CHANNEL = 'mswa:video-worker-status';

// Bridges worker status to browser SSE: Redis fan-out across API instances, then in-memory stream per video.
@Injectable()
export class VideoWorkerSseService {
  private logger = new Logger(VideoWorkerSseService.name);
  private readonly bus = new Subject<VideoWorkerSsePayload>();
  private subscriber: Redis | null = null;
  private redisFanout = false;

  constructor(private readonly kvService: KvService) {}

  /**
   * Nest lifecycle hook:
   * Called once during app boot when this provider is instantiated.
   * Sets up the Redis pub/sub subscription so worker status events can be fanned out
   * to SSE clients connected to this API instance.
   * 
   * @throws Error if the Redis subscription or duplicate connection fails.
   */
  public async onModuleInit(): Promise<void> {
    try {
      // Create a dedicated Redis connection for pub/sub.
      this.subscriber = this.kvService.kv.duplicate();

      // Subscribe to the shared channel where workers publish status updates.
      await this.subscriber.subscribe(REDIS_CHANNEL);

      // Redis message is parsed and pushed into an in-memory Subject bus.
      this.subscriber.on('message', (_channel, message) => {
        try {
          const payload = JSON.parse(message) as VideoWorkerSsePayload;
          if (payload?.videoId) {
            this.bus.next(payload);
          }
        } catch (error) {
          // Ignore malformed messages so one bad publish doesn't break the stream.
          this.logger.warn('Ignoring invalid SSE fanout message', error);
        }
      });
      this.redisFanout = true;
      this.logger.log(`Subscribed to Redis channel ${REDIS_CHANNEL} for worker SSE`);
    } catch (error) {
      this.logger.warn(
        `Redis SSE subscriber failed; using in-process fanout only (${(error as Error).message})`,
      );
      this.redisFanout = false;
      if (this.subscriber) {
        try {
          await this.subscriber.quit();
        } catch {
          // Ignore errors during cleanup.
        }
        this.subscriber = null;
      }
    }
  }

  /**
   * Lifecycle hook:
   * Called once when the app/module is shutting down.
   * Cleans up the Redis pub/sub subscription to avoid dangling connections.
   * 
   * @throws Error if the Redis unsubscribe or quit fails.
   */
  public async onModuleDestroy(): Promise<void> {
    if (!this.subscriber) {
      return;
    }
    try {
      // Stop listening to the shared channel and close the Redis connection.
      await this.subscriber.unsubscribe(REDIS_CHANNEL);
      await this.subscriber.quit();
    } catch (error) {
      this.logger.warn('Error closing Redis SSE subscriber', error);
    }
    this.subscriber = null;
  }

  /**
   * Publishes worker status events to all API instances via Redis.
   * Each instance pushes to local SSE subscribers.
   * If Redis fanout is off, emits only locally.
   *
   * @param payload - The worker status event to publish.
   * @throws Error if the Redis publish or local delivery fails.
   */
  emit(payload: VideoWorkerSsePayload): void {
    try {
      if (this.redisFanout) {
        // Publish the worker status to the shared Redis channel.
        // Other API instances (and this one) receive it and forward to their own SSE clients.
        void this.kvService.kv
          .publish(REDIS_CHANNEL, JSON.stringify(payload))
          .catch((err: Error) => {
            this.logger.warn(
              `SSE Redis publish failed, emitting locally: ${err.message}`,
            );
            this.bus.next(payload);
          });
      } else {
        this.bus.next(payload);
      }
    } catch (error) {
      this.logger.warn(
        `SSE emit error, attempting local delivery: ${(error as Error).message}`,
      );
      this.bus.next(payload);
    }
  }

  /**
   * Streams worker status events for a video.
   *
   * @param videoId - The ID of the video to stream status for.
   * @returns An Observable of SSE `MessageEvent`s for the video.
   */
  streamForVideo(videoId: string): Observable<MessageEvent> {
    // Create a per-request stream view over the shared in-memory bus
    // filter events to only the requested `videoId` and auto-complete after the terminal `overall` status so the SSE connection can close.
    return this.bus.asObservable().pipe(
      filter((e) => e.videoId === videoId),
      takeWhile(
        (e) =>
          !(
            e.type === 'overall' &&
            e.overallStatus !== null &&
            Object.values(VIDEO_WORKER_OVERALL_STATUS).includes(
              e.overallStatus as VIDEO_WORKER_OVERALL_STATUS,
            )
          ),
        // Include the terminal `overall` event, then complete.
        true,
      ),
      map(
        (e) =>
          ({
            data: JSON.stringify(e),
          }) as MessageEvent,
      ),
    );
  }
}

