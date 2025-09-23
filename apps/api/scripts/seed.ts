import { drizzle } from "drizzle-orm/node-postgres";
import fs from "fs";
import { metadata, tenants, units } from "../src/infra/db/schema/tenants";
import { users } from "../src/infra/db/schema/auth";
import { exit, mainModule } from "process";
import { sql } from "drizzle-orm";

const DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";

const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...tenants, ...units, ...users },
});

async function main() {
  try {
    const { tenant, unit } = await db.transaction(async (tx) => {
      // I am unsure why it is returning invalid json
      const tenant = JSON.parse(
        JSON.stringify(
          await tx
            .insert(metadata)
            .values({
              name: "Test Tenant",
            })
            .returning(),
        ),
      )[0];
      const unit = JSON.parse(
        JSON.stringify(
          await tx
            .insert(units)
            .values({
              tenantId: tenant.id,
            })
            .returning(),
        ),
      )[0];

      await tx.insert(users).values({
        unitId: unit.id,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        encryptedPassword: sql`crypt('testing124', gen_salt('bf'))` as unknown as string,
      });

      return { tenant, unit };
    });

    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);

    console.log(
      `Successfully wrote unit ID to .env file for tenant ${tenant.id}`,
    );
    exit(0);
  } catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    throw new Error(`Seed failed: ${e}`);
  }
}

main();