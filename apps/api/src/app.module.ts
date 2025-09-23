import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './auth/auth.module';
import { UnitsModule } from './units/units.module';
import { OrgsModule } from './orgs/orgs.module';
import { MeModule } from './me/me.module';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    InfraModule,
    AuthModule,
    UnitsModule,
    OrgsModule,
    MeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
