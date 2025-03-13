import { drizzle } from "drizzle-orm/node-postgres";
import { metadata, tenants, units } from "../src/db/schema/tenants"
import fs from "fs"
import { DATABASE_URL } from "../src/config/constants";

export const db = drizzle(DATABASE_URL, {
    casing: "snake_case",
    schema: { ...tenants },
});


try {
    const tenant = await db.insert(metadata).values({
        name: "test",
    }).returning()[0]

    const unit = await db.insert(units).values({
        tenantId: tenant.id,
    }).returning()[0]


    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);

    console.log(`Successfully wrote unit ID to .env file for tenant ${tenant.id}`);
    process.exit(0);
}
catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    process.exit(1);
}