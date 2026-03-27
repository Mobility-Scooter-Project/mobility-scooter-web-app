import { AppConfig } from '@config/constants';
import { INVITE_STATUS, USER_ROLES } from '@config/enums';
import { UnitInvite } from '@infra/db/entity/unit/invite';
import { User } from '@infra/db/entity/user/user';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

type InviteResponse = {
  token: string;
};

@Injectable()
export class InvitesService {
  private logger = new Logger(InvitesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UnitInvite)
    private readonly inviteRepository: Repository<UnitInvite>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  /**
   *  Create an invite for a user to join a unit with a specific role.
   *
   * @param unitId - ID of the unit
   * @param userId - ID of the user creating the invite
   * @param role - Role for the invitee
   * @param email - Email of the invitee
   * @returns InviteResponse containing the invite token
   * @throws HttpException with appropriate status code and message on failure
   */
  public async createInvite(
    unitId: string,
    userId: string,
    role: USER_ROLES,
    email: string,
  ): Promise<InviteResponse> {
    let sender: User | null;

    try {
      sender = await this.userRepository.findOne({
        where: {
          id: userId,
          unit: {
            id: unitId,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to fetch user', error);
      throw new HttpException('Internal Server Error', 500);
    }

    if (!sender) {
      this.logger.warn(
        `User ${userId} attempted to create an invite for unit ${unitId} but does not belong to that unit`,
      );
      throw new HttpException('Invalid unit', 400);
    }

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days expiration

    let inviteId: string;
    try {
      const inviteRecord = {
        unit: { id: unitId },
        invitedBy: { id: userId },
        role,
        expiresAt: new Date(exp * 1000),
        invite_url: 'TODO FE',
        inviteeEmail: email,
      };

      const invite = this.inviteRepository.create(inviteRecord);
      await this.inviteRepository.save(invite);
      inviteId = invite.id;
    } catch (error) {
      this.logger.error('Failed to create invite record', error);
      throw new HttpException('Internal Server Error', 500);
    }
    const payload = {
      unitId,
      role,
      exp,
      id: inviteId,
    };

    let inviteToken: string;
    try {
      inviteToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('jwtSecret'),
      });
    } catch (error) {
      this.logger.error('Failed to sign invite token', error);
      throw new HttpException('Internal Server Error', 500);
    }

    return { token: inviteToken };
  }

  // TODO: revoke invite

  public async acceptInvite(token: string): Promise<void> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('jwtSecret'),
      });
    } catch (error) {
      this.logger.warn('Invalid or expired invite token', error);
      throw new HttpException('Invalid or expired invite token', 400);
    }

    const { unitId, role, exp, id } = payload;

    if (!unitId || !role || !exp || !id) {
      this.logger.warn('Invite token is missing required fields');
      throw new HttpException('Invalid invite token', 400);
    }

    let invite: UnitInvite | null;
    try {
      invite = await this.inviteRepository.findOne({
        where: {
          id,
          role,
          expiresAt: new Date(exp * 1000),
        },
      });
    } catch (error) {
      this.logger.error('Failed to fetch invite record', error);
      throw new HttpException('Internal Server Error', 500);
    }

    if (!invite) {
      this.logger.warn('Invite token does not match any active invites');
      throw new HttpException('Invalid invite token', 400);
    }

    if (invite.status !== INVITE_STATUS.PENDING) {
      this.logger.warn(
        `Invite token has already been used or revoked. Status: ${invite.status}`,
      );
      throw new HttpException(
        'Invite token has already been used or revoked',
        400,
      );
    }

    // create new user
    try {
      const newUser = this.userRepository.create({
        unit: { id: unitId },
        role,
        email: invite.inviteeEmail,
      });
      await this.userRepository.save(newUser);
    } catch (error) {
      this.logger.error('Failed to create new user from invite', error);
      throw new HttpException('Internal Server Error', 500);
    }

    // mark invite as used
    try {
      invite.status = INVITE_STATUS.ACCEPTED;
      await this.inviteRepository.save(invite);
    } catch (error) {
      this.logger.error('Failed to update invite status to USED', error);
      throw new HttpException('Internal Server Error', 500);
    }
  }
}
