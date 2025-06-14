import { drizzle } from "drizzle-orm/node-postgres";
import { metadata, tenants, units } from "../src/db/schema/tenants"
import fs from "fs"
import { DATABASE_URL } from "../src/config/constants";

const db = drizzle(DATABASE_URL, {
    casing: "snake_case",
    schema: { ...tenants },
});

try {
    const { tenant, unit } = await db.transaction(async (tx) => {
        // I am unsure why it is returning invalid json
        const tenant = JSON.parse(JSON.stringify(await tx.insert(metadata).values({
            name: "Test Tenant",
        }).returning()))[0];
        const unit = JSON.parse(JSON.stringify(await tx.insert(units).values({
            tenantId: tenant.id,
        }).returning()))[0];


        return { tenant, unit };
    });



    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);

    console.log(`Successfully wrote unit ID to .env file for tenant ${tenant.id}`);
    process.exit(0);
}
catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    process.exit(1);
}