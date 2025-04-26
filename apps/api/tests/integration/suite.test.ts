
import { kv } from "@src/integrations/kv";
import { postgresDB } from "@src/middleware/db";
import { SHARED_DATA } from "@tests/config/constants";
import { sql } from "drizzle-orm";
import user from "./user/user";
import storage from "./storage/storage";

describe("Suite", () => {
    beforeEach(async () => {
        await kv.flushall();
    });

    user();
    storage();

    afterAll(async () => {
        await Promise.all([
            postgresDB.execute(
                sql`DELETE FROM auth.users WHERE email = ${SHARED_DATA.EMAIL}`,
            ),
            kv.flushall(),
        ]);
    });
});