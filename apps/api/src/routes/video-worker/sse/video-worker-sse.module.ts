import { MiddlewareConsumer, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InfraModule } from '@infra/infra.module';
import { JwtMiddleware } from '@src/middleware/jwt/jwt.middleware';
import { VideoWorkerSseController } from './video-worker-sse.controller';
import { VideoWorkerSseService } from './video-worker-sse.service';

@Module({
  imports: [InfraModule, JwtModule],
  controllers: [VideoWorkerSseController],
  providers: [VideoWorkerSseService],
  exports: [VideoWorkerSseService],
})
export class VideoWorkerSseModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(VideoWorkerSseController);
  }
}

