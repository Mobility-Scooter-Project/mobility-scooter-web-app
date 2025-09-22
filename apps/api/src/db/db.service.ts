import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DbService {
    private db: NodePgDatabase<typeof schema>;

    private constructor() {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        this.db = drizzle({
            client: pool,
            casing: 'snake_case',
            schema
        });
    }

}
