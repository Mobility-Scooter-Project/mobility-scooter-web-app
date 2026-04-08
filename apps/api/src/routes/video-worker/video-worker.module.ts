import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InfraModule } from '@infra/infra.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoWorkerService } from './video-worker.service';
import { VideoWorkerController } from './video-worker.controller';
import { VideoWorkerSseModule } from './sse/video-worker-sse.module';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    VideoWorkerSseModule,
    TypeOrmModule.forFeature([
      VideoWorkerStatus,
      VideoWorkerStepStatus,
      Video,
      User,
    ]),
  ],
  providers: [
    VideoWorkerService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  controllers: [VideoWorkerController],
})
export class VideoWorkerModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      // Webhooks are authenticated with `videoWorkerSecret` header (not Bearer JWT).
      .exclude(
        { path: 'video-worker/completed', method: RequestMethod.POST },
        { path: 'video-worker/step-completed', method: RequestMethod.POST },
      )
      .forRoutes(VideoWorkerController);
  }
}
