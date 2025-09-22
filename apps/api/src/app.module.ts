import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    InfraModule,
    AuthModule,
    UnitsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
