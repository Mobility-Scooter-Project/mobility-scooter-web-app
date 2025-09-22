import { Module } from '@nestjs/common';
import { KeystoneService } from './keystone/keystone.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { BarbicanService } from './barbican/barbican.service';
import { ConfigService } from '@nestjs/config';
import { KvService } from 'src/kv/kv.service';
import { KvModule } from 'src/kv/kv.module';

@Module({
  imports: [HttpModule, KvModule],
  providers: [KeystoneService,
    {
      provide: BarbicanService,
      useFactory: async (
        configService,
        keystoneService: KeystoneService,
        kvService,
        httpService
      ) => {
        return await BarbicanService.build(
          configService,
          keystoneService,
          kvService,
          httpService
        );
      },
      inject: [ConfigService, KeystoneService, KvService, HttpService],
    }],
})

export class OpenstackModule { }
