import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Org } from '@src/infra/db/entity/org/org';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Org])],
  controllers: [OrgsController],
  providers: [OrgsService],
})
export class OrgsModule {}
