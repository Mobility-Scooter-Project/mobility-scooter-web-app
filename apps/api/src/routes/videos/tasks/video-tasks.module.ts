import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InfraModule } from '@src/infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoTask } from '@infra/db/entity/video/task';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';

import { VideoTasksController } from './video-tasks.controller';
import { VideoTasksService } from './video-tasks.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([VideoTask, Video, User]),
  ],
  providers: [
    VideoTasksService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  controllers: [VideoTasksController],
})
export class VideoTasksModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideoTasksController);
  }
}
