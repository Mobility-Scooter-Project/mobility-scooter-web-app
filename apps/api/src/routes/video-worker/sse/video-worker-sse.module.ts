import { MiddlewareConsumer, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InfraModule } from '@infra/infra.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';
import { VideoWorkerSseController } from './video-worker-sse.controller';
import { VideoWorkerSseService } from './video-worker-sse.service';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([Video, User]),
  ],
  controllers: [VideoWorkerSseController],
  providers: [
    VideoWorkerSseService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  exports: [VideoWorkerSseService],
})
export class VideoWorkerSseModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideoWorkerSseController);
  }
}

