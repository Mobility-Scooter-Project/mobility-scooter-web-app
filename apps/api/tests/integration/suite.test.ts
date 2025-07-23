
import { postgresDB } from "@src/middleware/db";
import { SHARED_DATA } from "@tests/config/constants";
import { sql } from "drizzle-orm";
import user from "./user/user";
import storage from "./storage/storage";
import container, { KVSymbol } from "@src/lib/container";
import Redis from "ioredis";


describe("Suite", () => {
    beforeEach(async () => {
        const kv = await container.getAsync<Redis>(KVSymbol);
        await kv.flushall();
    });

    user();
    storage();

    afterAll(async () => {
        const kv = await container.getAsync<Redis>(KVSymbol);
        await Promise.all([
            postgresDB.execute(
                sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`,
            ),
            kv.flushall(),
        ]);
    });
});