import { Module } from '@nestjs/common';
import { KvService } from './kv.service';

@Module({
    providers: [KvService],
    exports: [KvService],
})
export class KvModule { }