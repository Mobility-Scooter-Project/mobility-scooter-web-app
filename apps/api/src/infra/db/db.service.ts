import { AppConfig } from '@src/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DbService {
  public db: DataSource;

  constructor(
    private readonly configService: ConfigService<AppConfig>
  ) {
    this.db = new DataSource({
      type: 'postgres',
      host: this.configService.get('database').host,
      port: this.configService.get('database').port,
      username: this.configService.get('database').user,
      password: this.configService.get('database').password,
      database: this.configService.get('database').database,
      synchronize: true,
    })
  }

  public static async build(configService: ConfigService<AppConfig>) {
    const dbService = new DbService(configService);
    dbService.db = await dbService.db.initialize();
    return dbService;
  }
}
