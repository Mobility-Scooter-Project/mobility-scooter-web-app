import { Test, TestingModule } from '@nestjs/testing';
import { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take } from 'rxjs';
import { KvService } from '@infra/kv/kv.service';
import { VideoWorkerSseService } from './video-worker-sse.service';

describe('VideoWorkerSseService', () => {
  let service: VideoWorkerSseService;

  const messageHandler = jest.fn();
  const subscribe = jest.fn((_ch: string, cb?: (err: Error | null) => void) => {
    cb?.(null);
    return Promise.resolve();
  });
  const publish = jest.fn().mockResolvedValue(1);
  const quit = jest.fn().mockResolvedValue('OK');
  const unsubscribe = jest.fn().mockResolvedValue(1);

  const duplicate = jest.fn(() => ({
    subscribe,
    on: (_ev: string, fn: (ch: string, msg: string) => void) => {
      if (_ev === 'message') {
        messageHandler.mockImplementation(fn);
      }
    },
    quit,
    unsubscribe,
  }));

  const kvMock = {
    kv: {
      duplicate,
      publish,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoWorkerSseService,
        { provide: KvService, useValue: kvMock },
      ],
    }).compile();

    service = module.get(VideoWorkerSseService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('subscribes to Redis and forwards parsed payloads to streamForVideo', async () => {
    expect(duplicate).toHaveBeenCalled();

    const payload = {
      type: 'step' as const,
      videoId: 'vid-a',
      step: 'pose_estimation',
      status: 'completed',
      durationSec: 1,
      attempts: 0,
      lastError: null,
    };

    const evtPromise = firstValueFrom(
      service.streamForVideo('vid-a').pipe(take(1)),
    );
    messageHandler('mswa:video-worker-status', JSON.stringify(payload));

    const evt = await evtPromise;
    expect(evt.data).toBe(JSON.stringify(payload));
  });

  it('ignores messages for other videos', async () => {
    const pending = firstValueFrom(
      service.streamForVideo('vid-a').pipe(take(1)),
    );

    messageHandler(
      'mswa:video-worker-status',
      JSON.stringify({
        type: 'step',
        videoId: 'vid-b',
        step: 'pose_estimation',
        status: 'completed',
        durationSec: 1,
        attempts: 0,
        lastError: null,
      }),
    );

    await expect(
      Promise.race([
        pending,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 100),
        ),
      ]),
    ).rejects.toThrow('timeout');
  });

  it('emit publishes to Redis when fanout is enabled', () => {
    service.emit({
      type: 'overall',
      videoId: 'v1',
      overallStatus: 'processed',
      durationSec: 9,
    });

    expect(publish).toHaveBeenCalledWith(
      'mswa:video-worker-status',
      expect.stringContaining('"videoId":"v1"'),
    );
  });

  it('completes the stream after emitting terminal overall status', async () => {
    const terminalPayload = {
      type: 'overall' as const,
      videoId: 'vid-a',
      overallStatus: 'processed',
      durationSec: 9,
    };

    const received: string[] = [];
    await new Promise<void>((resolve, reject) => {
      service.streamForVideo('vid-a').subscribe({
        next: (evt) => received.push(String(evt.data)),
        error: reject,
        complete: resolve,
      });

      messageHandler(
        'mswa:video-worker-status',
        JSON.stringify(terminalPayload),
      );
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(JSON.stringify(terminalPayload));
  });
});

