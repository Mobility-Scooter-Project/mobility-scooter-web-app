import { drizzle } from "drizzle-orm/node-postgres";
import fs from "fs";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";
import { metadata, tenants, units } from "../src/db/schema/tenants.js";
import { users } from "../src/db/schema/auth.js";
import { exit } from "process";
import { eq } from "drizzle-orm";

console.log("DATABASE_URL:", DATABASE_URL);

const db = drizzle(DATABASE_URL, {
  casing: "snake_case",
  schema: { ...tenants, ...users },
});

try {
  const { tenant, unit, user } = await db.transaction(async (tx) => {
    // 1. Create the tenant first
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

    // 2. Create the unit without adminUserId initially
    const unit = JSON.parse(
      JSON.stringify(
        await tx
          .insert(units)
          .values({
            tenantId: tenant.id,
            adminUserId: null, // Will update this later
          })
          .returning(),
      ),
    )[0];

    // 3. Create the user with the unit reference
    const user = JSON.parse(
      JSON.stringify(
        await tx
          .insert(users)
          .values({
            unitId: unit.id,
            email: `testuser_${new Date().getTime()}@example.com`,
            encryptedPassword: "testpassword",
            firstName: "Test",
            lastName: "User",
            permissions: { isAdmin: true },
          })
          .returning(),
      ),
    )[0];

    // 4. Update the unit with the admin user reference
    const updatedUnit = JSON.parse(
      JSON.stringify(
        await tx
          .update(units)
          .set({ adminUserId: user.id })
          .where(eq(units.id, unit.id))
          .returning(),
      ),
    )[0];

    return { tenant, unit: updatedUnit, user };
  });

  fs.appendFileSync(
    ".env",
    `\nTENANT_ID=${tenant.id}\nTESTING_UNIT_ID=${unit.id}\nTEST_USER_ID=${user.id}\n`,
  );

  console.log(
    `Successfully wrote unit ID and user ID to .env file for tenant ${tenant.id}`,
  );
  console.log("Tenant ID:", tenant.id);
  console.log("Unit ID:", unit.id);
  console.log("User ID:", user.id);
  exit(0);
} catch (e) {
  console.error(`Failed to write unit ID and user ID to .env file: ${e}`);
  throw new Error(`Seed failed: ${e}`);
}
