import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { createMock } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Patient } from '@infra/db/entity/unit/patient';
import { PatientSession } from '@infra/db/entity/video/session';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';
import { SessionsService } from './sessions.service';
import { SessionDto } from './sessions.dto';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let patientSessionRepository: Repository<PatientSession>;
  let patientRepository: Repository<Patient>;
  let userRepository: Repository<User>;
  let videoRepository: Repository<Video>;

  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const unitId = '11111111-2222-3333-4444-555555555555';
  const otherUnitId = '99999999-8888-7777-6666-555555555555';
  /** Internal patient PK (UUID) returned by API as `patientUuid`. */
  const patientId = '66666666-7777-8888-9999-aaaaaaaaaaaa';
  /** Unit-scoped client id (SessionDto.patientId), e.g. "10". */
  const patientCode = '10';
  const sessionId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

  const userInUnit = {
    id: userId,
    unit: { id: unitId },
  } as User;

  const dto: SessionDto = {
    patientId: patientCode,
    sessionDate: '2025-03-01',
    sessionTime: '14:30',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([PatientSession, Patient, User, Video]),
      ],
      providers: [SessionsService, UnitAuthorizationService],
    })
      .useMocker(createMock)
      .compile();

    service = module.get<SessionsService>(SessionsService);
    patientSessionRepository = module.get<Repository<PatientSession>>(
      getRepositoryToken(PatientSession),
    );
    patientRepository = module.get<Repository<Patient>>(
      getRepositoryToken(Patient),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userInUnit);
    });

    it('creates a session and normalizes session time', async () => {
      const patientInUnit = {
        uuid: patientId,
        patientId: patientCode,
        unit: { id: unitId },
      } as Patient;

      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(patientInUnit);
      jest
        .spyOn(patientSessionRepository, 'create')
        .mockImplementation((e) => e as PatientSession);
      jest.spyOn(patientSessionRepository, 'save').mockResolvedValue({
        id: sessionId,
      } as PatientSession);

      const result = await service.createSession(userId, unitId, dto);

      expect(result).toEqual({ sessionId, patientUuid: patientId });
      expect(patientSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionDate: dto.sessionDate,
          sessionTime: '14:30:00',
        }),
      );
      expect(patientSessionRepository.save).toHaveBeenCalled();
    });

    it('throws FORBIDDEN when user is not in the unit', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: userId,
        unit: { id: otherUnitId },
      } as User);

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'User does not belong to this unit',
        status: HttpStatus.FORBIDDEN,
      });
      expect(patientRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when user has no unit', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({
        id: userId,
        unit: null,
      } as unknown as User);

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'User does not belong to this unit',
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('creates patient when patient does not exist', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(patientRepository, 'create')
        .mockImplementation((e) => e as Patient);
      jest.spyOn(patientRepository, 'save').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: unitId },
      } as Patient);
      jest
        .spyOn(patientSessionRepository, 'create')
        .mockImplementation((e) => e as PatientSession);
      jest.spyOn(patientSessionRepository, 'save').mockResolvedValue({
        id: sessionId,
      } as PatientSession);

      const result = await service.createSession(userId, unitId, dto);

      expect(patientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: patientCode,
          unit: { id: unitId },
        }),
      );
      expect(patientRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        sessionId,
        patientUuid: patientId,
      });
    });

    it('throws FORBIDDEN when patient belongs to another unit', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: otherUnitId },
      } as Patient);

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'Patient does not belong to this unit',
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when patient lookup fails', async () => {
      jest
        .spyOn(patientRepository, 'findOne')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when save fails', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: unitId },
      } as Patient);
      jest
        .spyOn(patientSessionRepository, 'create')
        .mockImplementation((e) => e as PatientSession);
      jest
        .spyOn(patientSessionRepository, 'save')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('throws CONFLICT when duplicate session for same patient+time is created', async () => {
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: unitId },
      } as Patient);
      jest
        .spyOn(patientSessionRepository, 'create')
        .mockImplementation((e) => e as PatientSession);
      jest.spyOn(patientSessionRepository, 'save').mockRejectedValue({
        code: '23505',
      });

      await expect(
        service.createSession(userId, unitId, dto),
      ).rejects.toMatchObject({
        response: 'Session already exists for this patient at that date/time',
        status: HttpStatus.CONFLICT,
      });
    });
  });

  describe('getSessions', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userInUnit);
    });

    it('returns sessions for the unit', async () => {
      const rows = [
        {
          id: sessionId,
          patient: { uuid: patientId },
          sessionDate: '2025-01-15',
          sessionTime: '09:00:00',
        },
      ] as PatientSession[];

      jest.spyOn(patientSessionRepository, 'find').mockResolvedValue(rows);

      const result = await service.getSessions(userId, unitId);

      expect(patientSessionRepository.find).toHaveBeenCalledWith({
        where: { unit: { id: unitId } },
        relations: { patient: true },
        order: { cud: { createdAt: 'DESC' } },
        select: {
          id: true,
          sessionDate: true,
          sessionTime: true,
          patient: { uuid: true },
        },
      });
      expect(result).toEqual([
        {
          sessionId,
          patientUuid: patientId,
          sessionDate: '2025-01-15',
          sessionTime: '09:00:00',
        },
      ]);
    });

    it('throws FORBIDDEN when user is not in the unit', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getSessions(userId, unitId)).rejects.toMatchObject({
        response: 'User does not belong to this unit',
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when list fails', async () => {
      jest
        .spyOn(patientSessionRepository, 'find')
        .mockRejectedValue(new Error('db error'));

      await expect(service.getSessions(userId, unitId)).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('getSession', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userInUnit);
    });

    it('returns a single session', async () => {
      const row = {
        id: sessionId,
        patient: { uuid: patientId },
        sessionDate: '2025-02-01',
        sessionTime: '12:00:00',
      } as PatientSession;

      jest.spyOn(patientSessionRepository, 'findOne').mockResolvedValue(row);

      const result = await service.getSession(userId, unitId, sessionId);

      expect(patientSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId, unit: { id: unitId } },
        relations: { patient: true },
        select: {
          id: true,
          sessionDate: true,
          sessionTime: true,
          patient: { uuid: true },
        },
      });
      expect(result).toEqual({
        sessionId,
        patientUuid: patientId,
        sessionDate: '2025-02-01',
        sessionTime: '12:00:00',
      });
    });

    it('throws NOT_FOUND when session is missing', async () => {
      jest.spyOn(patientSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSession(userId, unitId, sessionId),
      ).rejects.toMatchObject({
        response: 'Session not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when lookup fails', async () => {
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.getSession(userId, unitId, sessionId),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('getSessionVideos', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userInUnit);
    });

    it('returns minimal session video list', async () => {
      const videoId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue({ id: sessionId } as PatientSession);
      jest.spyOn(videoRepository, 'find').mockResolvedValue([
        {
          id: videoId,
          file: {
            name: 'clip.mp4',
          },
        } as Video,
      ]);

      const result = await service.getSessionVideos(userId, unitId, sessionId);

      expect(patientSessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId, unit: { id: unitId } },
        select: { id: true },
      });
      expect(videoRepository.find).toHaveBeenCalledWith({
        where: { session: { id: sessionId } },
        relations: { file: true },
        order: { cud: { createdAt: 'ASC' } },
        select: { id: true, file: { name: true } },
      });
      expect(result).toEqual([{ videoId, name: 'clip.mp4' }]);
    });

    it('returns empty array when session has no videos', async () => {
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue({ id: sessionId } as PatientSession);
      jest.spyOn(videoRepository, 'find').mockResolvedValue([]);

      const result = await service.getSessionVideos(userId, unitId, sessionId);

      expect(result).toEqual([]);
    });

    it('throws NOT_FOUND when session is not in unit', async () => {
      jest.spyOn(patientSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getSessionVideos(userId, unitId, sessionId),
      ).rejects.toMatchObject({
        response: 'Session not found',
        status: HttpStatus.NOT_FOUND,
      });
      expect(videoRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    beforeEach(() => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userInUnit);
    });

    const existingSession = {
      id: sessionId,
      patient: { uuid: patientId },
      sessionDate: '2025-01-01',
      sessionTime: '08:00:00',
    } as PatientSession;

    it('updates session when patient and session belong to unit', async () => {
      const newPatientId = 'cccccccc-dddd-eeee-ffff-000000000001';
      const updateDto: SessionDto = {
        patientId: newPatientId,
        sessionDate: '2025-04-01',
        sessionTime: '16:45',
      };

      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue(existingSession);
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: newPatientId,
        patientId: newPatientId,
        unit: { id: unitId },
      } as Patient);
      jest.spyOn(patientSessionRepository, 'save').mockResolvedValue({
        id: sessionId,
      } as PatientSession);

      const result = await service.updateSession(
        userId,
        unitId,
        sessionId,
        updateDto,
      );

      expect(result).toEqual({ sessionId });
      expect(patientSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionDate: '2025-04-01',
          sessionTime: '16:45:00',
        }),
      );
    });

    it('throws NOT_FOUND when session does not exist', async () => {
      jest.spyOn(patientSessionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateSession(userId, unitId, sessionId, dto),
      ).rejects.toMatchObject({
        response: 'Session not found',
        status: HttpStatus.NOT_FOUND,
      });
      expect(patientRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when new patient does not exist', async () => {
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue(existingSession);
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateSession(userId, unitId, sessionId, dto),
      ).rejects.toMatchObject({
        response: 'Patient not found',
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('throws FORBIDDEN when new patient is in another unit', async () => {
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue(existingSession);
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: otherUnitId },
      } as Patient);

      await expect(
        service.updateSession(userId, unitId, sessionId, dto),
      ).rejects.toMatchObject({
        response: 'Patient does not belong to this unit',
        status: HttpStatus.FORBIDDEN,
      });
    });

    it('throws INTERNAL_SERVER_ERROR when save fails', async () => {
      jest
        .spyOn(patientSessionRepository, 'findOne')
        .mockResolvedValue(existingSession);
      jest.spyOn(patientRepository, 'findOne').mockResolvedValue({
        uuid: patientId,
        patientId: patientCode,
        unit: { id: unitId },
      } as Patient);
      jest
        .spyOn(patientSessionRepository, 'save')
        .mockRejectedValue(new Error('db error'));

      await expect(
        service.updateSession(userId, unitId, sessionId, dto),
      ).rejects.toMatchObject({
        response: 'Internal Server Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
