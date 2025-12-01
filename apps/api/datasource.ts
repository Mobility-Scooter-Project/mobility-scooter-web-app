import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

let datasource;

if (process.env.DATABASE_URL) {
    datasource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        synchronize: false,
        migrations: ['./src/infra/db/migrations/*.{ts,js}'],
        entities: ['./src/infra/db/entity/**/*.{ts,js}']
    })
} else {
    datasource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        synchronize: false, // if this is set to true, updates will run automatically, and generating migrations will become impossible
        migrations: ['./src/infra/db/migrations/*.{ts,js}'],
        entities: ['./src/infra/db/entity/**/*.{ts,js}']
    })
}

export default datasource;