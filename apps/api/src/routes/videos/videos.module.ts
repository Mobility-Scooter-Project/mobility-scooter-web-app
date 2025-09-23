import { MiddlewareConsumer, Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { InfraModule } from 'src/infra/infra.module';
import { JwtMiddleware } from 'src/middleware/jwt/jwt.middleware';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [InfraModule, JwtModule],
  providers: [VideosService],
  controllers: [VideosController],
})
export class VideosModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(VideosController);
  }
}
