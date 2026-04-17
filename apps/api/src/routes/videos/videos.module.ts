import { MiddlewareConsumer, Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { InfraModule } from '@src/infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '@src/infra/db/entity/video/video';
import { File } from '@src/infra/db/entity/unit/file';
import { PatientSession } from '@src/infra/db/entity/video/session';
import { User } from '@src/infra/db/entity/user/user';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { KeypointsModule } from './keypoints/keypoints.module';
import { VideoTasksModule } from './tasks/video-tasks.module';
import { VideoAnnotationsModule } from './annotations/video-annotations.module';
import { VideoStabilityModule } from './stability/video-stability.module';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([Video, File, PatientSession, User]),
    KeypointsModule,
    VideoTasksModule,
    VideoAnnotationsModule,
    VideoStabilityModule,
  ],
  providers: [
    VideosService,
    UnitAuthorizationService,
    VideoAuthorizationService,
  ],
  controllers: [VideosController],
})
export class VideosModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideosController);
  }
}
