import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './db/db.service';
import { KvService } from './kv/kv.service';
import { ConfigModule } from '@nestjs/config';
import config from './config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [config],
  })],
  controllers: [AppController],
  providers: [AppService, DbService, KvService],
})
export class AppModule { }
