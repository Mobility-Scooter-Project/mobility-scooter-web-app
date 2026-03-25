import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { SessionDto } from './sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('units/:unitId/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
  
  @Post()
  async createSession(
    @Req() req: { locals: { userId: string } },
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() body: SessionDto,
  ) {
    return this.sessionsService.createSession(req.locals.userId, unitId, body);
  }

  @Get()
  async getSessions(
    @Req() req: { locals: { userId: string } },
    @Param('unitId', ParseUUIDPipe) unitId: string,
  ) {
    return this.sessionsService.getSessions(req.locals.userId, unitId);
  }

  @Get(':sessionId')
  async getSession(
    @Req() req: { locals: { userId: string } },
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.sessionsService.getSession(req.locals.userId, unitId, sessionId);
  }


  @Put(':sessionId')
  async updateSession(
    @Req() req: { locals: { userId: string } },
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() body: SessionDto,
  ) {
    return this.sessionsService.updateSession(
      req.locals.userId,
      unitId,
      sessionId,
      body,
    );
  }
}
