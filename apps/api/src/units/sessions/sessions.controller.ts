import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('units/:unitId/sessions')
export class SessionsController {
    @Get()
    async getSessions() {
        // TODO
    }

    @Get(':sessionId')
    async getSession() {
        // TODO
    }

    @Put(':sessionId')
    async updateSession() {
        // TODO
    }

    @Post()
    async createSession() {
        // TODO
    }

    @Post(':sessionId/upload')
    async uploadVideo() {
        // TODO
    }

    @Delete(':sessionId')
    async deleteSession() {
        // TODO
    }
}
