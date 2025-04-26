import { DATABASE_URL } from "@src/config/constants";
import pg from "pg";
const { Pool } = pg;


/**
 * Database connection singleton class
 * @class DB
 * @description Manages a single PostgreSQL connection pool instance for the application
 */
export class DB {
    private static instance: DB;
    private pool;

    private constructor() {
        this.pool = new Pool({
            connectionString: DATABASE_URL,
        });
    }

    public static getInstance(): DB {
        if (!DB.instance) {
            DB.instance = new DB();
        }
        return DB.instance;
    }

    public getPool() {
        return this.pool;
    }
}

export const pool = DB.getInstance().getPool();