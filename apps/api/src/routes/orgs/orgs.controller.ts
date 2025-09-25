import { Controller, Patch, Post, Put } from '@nestjs/common';

@Controller('organizations')
export class OrgsController {
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
