import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Org } from '@src/infra/db/entity/org/org';

export type JoinSignupUnitOption = { id: string; name: string };

export type JoinSignupOrgOption = {
  id: string;
  name: string;
  units: JoinSignupUnitOption[];
};

@Injectable()
export class OrgsService {
  private readonly logger = new Logger(OrgsService.name);
  constructor(
    @InjectRepository(Org)
    private readonly orgRepository: Repository<Org>,
  ) {}

  /**
   * Public list for join-org sign-up: orgs with nested units (non–soft-deleted only).
   * @returns A promise that resolves to the list of join signup options
   */
  public async listJoinSignupOptions(): Promise<JoinSignupOrgOption[]> {
    const orgs = await this.orgRepository.find({
      relations: { units: true },
      order: { name: 'ASC' },
    });

    return orgs
      .filter((org) => !org.cud?.deletedAt)
      .map((org) => ({
        id: org.id,
        name: org.name,
        units: (org.units ?? [])
          .filter((unit) => !unit.cud?.deletedAt)
          .map((unit) => ({ id: unit.id, name: unit.name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((org) => org.units.length > 0);
  }
}
