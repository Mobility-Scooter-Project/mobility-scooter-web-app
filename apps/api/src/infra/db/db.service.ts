import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class DbService {
    private _db: DB;

    constructor() {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        this._db = drizzle({
            client: pool,
            casing: 'snake_case',
            schema
        });
    }

    get db(): NodePgDatabase<typeof schema> {
        return this._db;
    }

}
