import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InfraModule } from '@src/infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';
import { VideoAnnotation } from '@infra/db/entity/video/annotation';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';

import { VideoAnnotationsController } from './video-annotations.controller';
import { VideoAnnotationsService } from './video-annotations.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([VideoAnnotation, Video, User]),
  ],
  providers: [
    VideoAnnotationsService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  controllers: [VideoAnnotationsController],
})
export class VideoAnnotationsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideoAnnotationsController);
  }
}

