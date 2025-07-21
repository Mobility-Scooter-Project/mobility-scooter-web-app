import { DATABASE_URL } from "@src/config/constants";
import { injectable } from "inversify";
import pg from "pg";
const { Pool } = pg;


/**
 * Database connection singleton class
 * @class DB
 * @description Manages a single PostgreSQL connection pool instance for the application
 */
@injectable()
export class DBService {
    private static instance: DBService;
    private pool;

    private constructor() {
        this.pool = new Pool({
            connectionString: DATABASE_URL,
        });
    }

    public static getInstance(): DBService {
        if (!DBService.instance) {
            DBService.instance = new DBService();
        }
        return DBService.instance;
    }

    public getPool() {
        return this.pool;
    }
}

export const pool = DBService.getInstance().getPool();