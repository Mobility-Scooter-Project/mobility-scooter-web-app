import { Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { OrgsService } from './orgs.service';

@Controller('organizations')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  /**
   * Unauthenticated: org + unit pickers for self-service join sign-up.
   */
  @Get('join-signup-options')
  async joinSignupOptions() {
    const orgs = await this.orgsService.listJoinSignupOptions();
    return { orgs };
  }

  @Post('applications')
  async createOrgApplication() {
    // TODO
  }

  @Patch('applications/:applicationId')
  async editOrgApplication() {
    // TODO
  }

  @Post('applications/:applicationId')
  async submitOrgApplication() {
    // TODO
  }

  @Put('organizations/:orgId')
  async updateOrg() {
    // TODO
  }

  @Post('organizations/:orgId')
  async completeOnboarding() {
    // TODO
  }
}
