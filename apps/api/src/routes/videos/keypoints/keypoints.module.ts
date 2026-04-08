import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keypoint } from '@infra/db/entity/video/keypoint';
import { Video } from '@infra/db/entity/video/video';
import { User } from '@infra/db/entity/user/user';
import { InfraModule } from '@src/infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';
import { KeypointsController } from './keypoints.controller';
import { KeypointsService } from './keypoints.service';
import { UnitAuthorizationService } from '@src/shared/unit-authorization.service';
import { VideoAuthorizationService } from '@src/shared/video-authorization.service';

@Module({
  imports: [
    InfraModule,
    JwtModule,
    TypeOrmModule.forFeature([Keypoint, Video, User]),
  ],
  providers: [
    KeypointsService,
    VideoAuthorizationService,
    UnitAuthorizationService,
  ],
  controllers: [KeypointsController],
})
export class KeypointsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(KeypointsController);
  }
}
