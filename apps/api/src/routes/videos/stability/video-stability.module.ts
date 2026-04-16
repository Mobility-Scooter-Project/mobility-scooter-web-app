import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfraModule } from '@src/infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';
import { Stability } from '@infra/db/entity/video/stability';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { VideoStabilityController } from './video-stability.controller';
import { VideoStabilityService } from './video-stability.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([Stability, Video, User, VideoWorkerStepStatus]),
  ],
  providers: [
    VideoStabilityService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  controllers: [VideoStabilityController],
})
export class VideoStabilityModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideoStabilityController);
  }
}
