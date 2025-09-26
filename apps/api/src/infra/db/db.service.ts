import { AppConfig } from '@src/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

/**
 * Service responsible for managing the application's database connection using TypeORM and PostgreSQL.
 *
 * @remarks
 * This service initializes a TypeORM DataSource instance with configuration values
 * provided by the application's ConfigService. It supports asynchronous initialization
 * via the static {@link build} method to ensure the database connection is established before use.
 *
 * @example
 * ```typescript
 * const dbService = await DbService.build(configService);
 * ```
 *
 * @public
 */
@Injectable()
export class DbService {
  public dataSource: DataSource;

  /**
   * Initializes the database service by creating a new TypeORM DataSource instance
   * using PostgreSQL configuration values retrieved from the application's configuration service.
   *
   * @param configService - The configuration service providing access to application settings, including database credentials.
   */
  constructor(private readonly configService: ConfigService<AppConfig>) {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('database').host,
      port: this.configService.get('database').port,
      username: this.configService.get('database').user,
      password: this.configService.get('database').password,
      database: this.configService.get('database').database,
      entities: ['./src/infra/db/entity/**/*.{ts,js}'],
    });
  }

  /**
   * Asynchronously creates and initializes a new instance of `DbService`.
   *
   * @param configService - The configuration service providing application configuration.
   * @returns A promise that resolves to an initialized `DbService` instance.
   */
  public static async build(
    configService: ConfigService<AppConfig>,
  ): Promise<DbService> {
    const dbService = new DbService(configService);
    dbService.dataSource = await dbService.dataSource.initialize();
    return dbService;
  }
}
