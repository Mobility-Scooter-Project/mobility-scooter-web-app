import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { InfraModule } from '@infra/infra.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import config from '@config/constants';
import { S3Service } from '@src/infra/openstack/s3/s3.service';
import { SwiftService } from '@src/infra/openstack/swift/swift.service';
import { QueueService } from '@src/infra/queue/queue.service';
import { Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { File } from '@src/infra/db/entity/unit/file';
import { PatientSession } from '@src/infra/db/entity/video/session';
import { Video } from '@src/infra/db/entity/video/video';
import { User } from '@src/infra/db/entity/user/user';
import { createMock } from '@golevelup/ts-jest';

describe('VideosService', () => {
  let service: VideosService;
  let s3: S3Service;
  let swift: SwiftService;
  let queue: QueueService;

  let fileRepository: Repository<File>;
  let videoRepository: Repository<Video>;
  let patientSessionRepository: Repository<PatientSession>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [config],
        }),
        InfraModule,
        JwtModule,
        TypeOrmModule.forFeature([File, Video, PatientSession, User]),
      ],
      providers: [VideosService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<VideosService>(VideosService);
    s3 = module.get<S3Service>(S3Service);
    swift = module.get<SwiftService>(SwiftService);
    queue = module.get<QueueService>(QueueService);

    fileRepository = module.get<Repository<File>>(getRepositoryToken(File));
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
    patientSessionRepository = module.get<Repository<PatientSession>>(
      getRepositoryToken(PatientSession),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVideoMetadata', () => {
    it('should create video metadata', async () => {
      const patientId = 'test-patient-id';
      const sessionId = 'test-session-id';
      const fileName = 'test-video.mp4';
      const unitId = 'unit-1';

      jest.spyOn(patientSessionRepository, 'findOne').mockResolvedValue({
        id: sessionId,
        unit: { id: unitId },
        patient: { id: patientId },
      } as PatientSession);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: 'user-1',
        unit: { id: unitId },
      } as User);

      jest
        .spyOn(fileRepository, 'create')
        .mockImplementation((file) => file as any);
      jest.spyOn(fileRepository, 'save').mockImplementation(
        async (file) =>
          ({
            id: 'file-id',
            ...file,
          }) as any,
      );

      jest
        .spyOn(videoRepository, 'create')
        .mockImplementation((video) => video as any);
      jest.spyOn(videoRepository, 'save').mockImplementation(
        async (video) =>
          ({
            id: 'video-id',
            ...video,
          }) as any,
      );

      const result = await service.createVideoMetadata('user-1', {
        patientId,
        sessionId,
        fileName,
      });
      expect(result).toHaveProperty('id');
      expect(fileRepository.create).toHaveBeenCalledWith({
        name: fileName,
        type: 'video/mp4',
        path: `patients/${patientId}/sessions/${sessionId}/${fileName}`,
        uploadedBy: { id: 'user-1' },
        unit: { id: unitId },
      });
      expect(videoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          session: { id: sessionId },
          file: expect.objectContaining({
            id: 'file-id',
          }),
        }),
      );
    });
  });

  describe('uploadVideo', () => {
    it('should upload video', async () => {
      const videoId = 'test-video-id';
      const file = {
        originalname: 'test-video.mp4',
        buffer: Buffer.from('test video content'),
      } as Express.Multer.File;

      jest.spyOn(videoRepository, 'findOne').mockResolvedValue({
        id: videoId,
        file: {
          path: 'patients/test-patient-id/sessions/test-session-id/test-video.mp4',
        },
        session: {
          patient: { id: 'test-patient-id' },
          unit: { id: 'unit-1' },
        },
      } as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        unit: { id: 'unit-1' },
      } as User);

      jest.spyOn(swift, 'putObjectStream').mockResolvedValue();
      jest.spyOn(s3, 'presignedUrl').mockResolvedValue('http://presigned-url');

      jest.spyOn(queue, 'getProducer').mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
      } as any);

      await service.uploadVideo('user-1', videoId, file);
      expect(videoRepository.findOne).toHaveBeenCalledWith({
        where: { id: videoId },
        relations: { file: true, session: { patient: true, unit: true } },
        select: {
          file: { id: true, path: true },
          session: {
            id: true,
            patient: { id: true },
            unit: { id: true },
          },
        },
      });
      expect(swift.putObjectStream).toHaveBeenCalled();
      expect(s3.presignedUrl).toHaveBeenCalled();
    });
  });
});
