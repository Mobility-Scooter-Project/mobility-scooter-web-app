import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { InfraModule } from '@infra/infra.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import config from '@src/config';
import { DbService } from '@src/infra/db/db.service';
import { S3Service } from '@src/infra/openstack/s3/s3.service';
import { SwiftService } from '@src/infra/openstack/swift/swift.service';
import { QueueService } from '@src/infra/queue/queue.service';

describe('VideosService', () => {
  let service: VideosService;
  let db: DbService;
  let s3: S3Service;
  let swift: SwiftService;
  let queue: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        InfraModule,
        JwtModule,
      ],
      providers: [VideosService],
    }).compile();

    service = module.get<VideosService>(VideosService);
    db = module.get<DbService>(DbService);
    s3 = module.get<S3Service>(S3Service);
    swift = module.get<SwiftService>(SwiftService);
    queue = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVideoMetadata', () => {
    it('should create video metadata', async () => {
      const patientId = 'test-patient-id';
      const sessionId = 'test-session-id';
      const fileName = 'test-video.mp4';

      service.fileRepository = {
        create: jest
          .fn()
          .mockReturnValue({
            name: fileName,
            type: 'video/mp4',
            path: `patients/${patientId}/sessions/${sessionId}/${fileName}`,
          }),
        save: jest
          .fn()
          .mockResolvedValue({
            id: 'file-id',
            name: fileName,
            type: 'video/mp4',
            path: `patients/${patientId}/sessions/${sessionId}/${fileName}`,
          }),
      } as any;

      service.videoRepository = {
        create: jest
          .fn()
          .mockReturnValue({
            session: { id: sessionId },
            file: { id: 'file-id' },
          }),
        save: jest
          .fn()
          .mockResolvedValue({
            id: 'video-id',
            session: { id: sessionId },
            file: { id: 'file-id' },
          }),
      } as any;

      const result = await service.createVideoMetadata(
        patientId,
        sessionId,
        fileName,
      );
      expect(result).toHaveProperty('id');
    });
  });

  describe('uploadVideo', () => {
    it('should upload video', async () => {
      const videoId = 'test-video-id';
      const file = {
        originalname: 'test-video.mp4',
        buffer: Buffer.from('test video content'),
      } as Express.Multer.File;

      service.videoRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: videoId,
          file: {
            path: `patients/test-patient-id/sessions/test-session-id/test-video.mp4`,
          },
          session: { patient: { id: 'test-patient-id' } },
        }),
      } as any;

      jest.spyOn(swift, 'putObjectStream').mockResolvedValue();
      jest.spyOn(s3, 'presignedUrl').mockResolvedValue('http://presigned-url');

      jest.spyOn(queue, 'getProducer').mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
      } as any);

      await service.uploadVideo(videoId, file);
      expect(swift.putObjectStream).toHaveBeenCalled();
      expect(s3.presignedUrl).toHaveBeenCalled();
    });
  });
});
