import { Patient } from '@infra/db/entity/unit/patient';
import { PatientSession } from '@infra/db/entity/video/session';
import { Unit } from '@infra/db/entity/unit/unit';
import { User } from '@infra/db/entity/user/user';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionDto } from './sessions.dto';

@Injectable()
export class SessionsService {
  private logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(PatientSession)
    private readonly patientSessionRepository: Repository<PatientSession>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a patient_session for the given unit after verifying the caller
   * belongs to that unit. If the patient does not exist, it is created in the unit.
   * 
   * @param userId - ID of the user creating the session
   * @param unitId - ID of the unit
   * @param dto - SessionDto containing the session details
   * @returns { sessionId: string } - The ID of the created session
   * @throws HttpException with appropriate status code and message on failure
   */
  public async createSession(
    userId: string,
    unitId: string,
    dto: SessionDto,
  ): Promise<{ sessionId: string }> {
    await this.assertUserInUnit(userId, unitId);

    let patient: Patient | null;
    try {
      patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
        relations: { unit: true },
        select: { id: true, unit: { id: true } },
      });
    } catch (error) {
      this.logger.error('Failed to load patient for session', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!patient) {
      try {
        patient = await this.patientRepository.save(
          this.patientRepository.create({
            id: dto.patientId,
            age: 0,
            gender: 'unknown',
            notes: JSON.stringify({}),
            unit: { id: unitId } as Unit,
          }),
        );
      } catch (error) {
        this.logger.error('Failed to create patient for session', error);
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    if (patient.unit.id !== unitId) {
      this.logger.warn(
        `Patient ${dto.patientId} does not belong to unit ${unitId}`,
      );
      throw new HttpException(
        'Patient does not belong to this unit',
        HttpStatus.FORBIDDEN,
      );
    }

    const sessionTime = this.normalizeSessionTime(dto.sessionTime);

    const session = this.patientSessionRepository.create({
      patient: { id: dto.patientId } as Patient,
      unit: { id: unitId } as Unit,
      sessionDate: dto.sessionDate,
      sessionTime,
    });

    let saved: PatientSession;
    try {
      saved = await this.patientSessionRepository.save(session);
    } catch (error) {
      this.logger.error('Failed to create session', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { sessionId: saved.id };
  }

  /**
   * Gets all sessions for a given unit.
   * @param userId - ID of the user getting the sessions
   * @param unitId - ID of the unit
   * @returns Array of sessions with sessionId, patientId, sessionDate, and sessionTime
   * @throws HttpException with appropriate status code and message on failure
   * @returns 
   */
  public async getSessions(
    userId: string,
    unitId: string,
  ): Promise<
    Array<{
      sessionId: string;
      patientId: string;
      sessionDate: string;
      sessionTime: string;
    }>
  > {
    await this.assertUserInUnit(userId, unitId);

    let sessions: PatientSession[];
    try {
      sessions = await this.patientSessionRepository.find({
        where: { unit: { id: unitId } },
        relations: { patient: true },
        order: { cud: { createdAt: 'DESC' } },
        select: {
          id: true,
          sessionDate: true,
          sessionTime: true,
          patient: { id: true },
        },
      });
    } catch (error) {
      this.logger.error('Failed to list sessions', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return sessions.map((session) => ({
      sessionId: session.id,
      patientId: session.patient.id,
      sessionDate: session.sessionDate,
      sessionTime: session.sessionTime,
    }));
  }

  /**
   * Gets a single session for a given unit.
   * @param userId - ID of the user getting the session
   * @param unitId - ID of the unit
   * @param sessionId - ID of the session
   * @returns Session with sessionId, patientId, sessionDate, and sessionTime
   * @throws HttpException with appropriate status code and message on failure
   */
  public async getSession(
    userId: string,
    unitId: string,
    sessionId: string,
  ): Promise<{
    sessionId: string;
    patientId: string;
    sessionDate: string;
    sessionTime: string;
  }> {
    await this.assertUserInUnit(userId, unitId);

    let session: PatientSession | null;
    try {
      session = await this.patientSessionRepository.findOne({
        where: { id: sessionId, unit: { id: unitId } },
        relations: { patient: true },
        select: {
          id: true,
          sessionDate: true,
          sessionTime: true,
          patient: { id: true },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get session', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!session) {
      this.logger.warn(
        `Session ${sessionId} not found for unit ${unitId}`,
      );
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    return {
      sessionId: session.id,
      patientId: session.patient.id,
      sessionDate: session.sessionDate,
      sessionTime: session.sessionTime,
    };
  }

  /**
   * Updates a session for a given unit.
   * @param userId - ID of the user updating the session
   * @param unitId - ID of the unit
   * @param sessionId - ID of the session
   * @param dto - SessionDto containing the session details
   * @returns { sessionId: string } - The ID of the updated session
   * @throws HttpException with appropriate status code and message on failure
   */
  public async updateSession(
    userId: string,
    unitId: string,
    sessionId: string,
    dto: SessionDto,
  ): Promise<{ sessionId: string }> {
    await this.assertUserInUnit(userId, unitId);

    let session: PatientSession | null;
    try {
      session = await this.patientSessionRepository.findOne({
        where: { id: sessionId, unit: { id: unitId } },
        relations: { patient: true },
      });
    } catch (error) {
      this.logger.error('Failed to load session for update', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!session) {
      this.logger.warn(
        `Session ${sessionId} not found for unit ${unitId} (update)`,
      );
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    let patient: Patient | null;
    try {
      patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
        relations: { unit: true },
        select: { id: true, unit: { id: true } },
      });
    } catch (error) {
      this.logger.error('Failed to load patient for update', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!patient) {
      this.logger.warn(`Patient ${dto.patientId} not found for session update`);
      throw new HttpException('Patient not found', HttpStatus.NOT_FOUND);
    }

    if (patient.unit.id !== unitId) {
      this.logger.warn(
        `Patient ${dto.patientId} does not belong to unit ${unitId}`,
      );
      throw new HttpException(
        'Patient does not belong to this unit',
        HttpStatus.FORBIDDEN,
      );
    }

    session.patient = { id: dto.patientId } as Patient;
    session.sessionDate = dto.sessionDate;
    session.sessionTime = this.normalizeSessionTime(dto.sessionTime);

    let saved: PatientSession;
    try {
      saved = await this.patientSessionRepository.save(session);
    } catch (error) {
      this.logger.error('Failed to update session', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { sessionId: saved.id };
  }

  /**
   * Ensures the user belongs to the given unit.
   * @param userId - ID of the user
   * @param unitId - ID of the unit
   * @returns void
   * @throws HttpException with appropriate status code and message on failure
   */
  private async assertUserInUnit(userId: string, unitId: string): Promise<void> {
    let user: User | null;
    try {
      user = await this.userRepository.findOne({
        where: { id: userId },
        relations: { unit: true },
        select: { id: true, unit: { id: true } },
      });
    } catch (error) {
      this.logger.error('Failed to verify user unit', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!user?.unit || user.unit.id !== unitId) {
      this.logger.warn(
        `User ${userId} attempted access to unit ${unitId} but does not belong to that unit`,
      );
      throw new HttpException(
        'User does not belong to this unit',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Ensures Postgres `time` format `HH:MM:SS`.
   * @param t - The time string to normalize
   * @returns The normalized time string
   */
  private normalizeSessionTime(t: string): string {
    const parts = t.split(':');
    const h = (parts[0] ?? '00').padStart(2, '0');
    const m = (parts[1] ?? '00').padStart(2, '0');
    const s = (parts[2] ?? '00').padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
