import { Module } from '@nestjs/common';
import { KeystoneService } from './keystone/keystone.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [KeystoneService]
})
export class OpenstackModule { }
