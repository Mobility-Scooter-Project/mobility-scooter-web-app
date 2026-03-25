import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from '@infra/infra.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoWorkerStatus } from '@infra/db/entity/video-worker/status';
import { VideoWorkerStepStatus } from '@infra/db/entity/video-worker/step-status';
import { Video } from '@infra/db/entity/video/video';
import { VideoWorkerService } from './video-worker.service';
import { VideoWorkerController } from './video-worker.controller';

@Module({
  imports: [
    ConfigModule,
    InfraModule,
    TypeOrmModule.forFeature([
      VideoWorkerStatus,
      VideoWorkerStepStatus,
      Video,
    ]),
  ],
  providers: [VideoWorkerService],
  controllers: [VideoWorkerController],
})
export class VideoWorkerModule {}
