import fs from "fs";
import { exit, } from "process";
import db from "datasource";
import { Org } from "@src/infra/db/entity/org/org";
import { Unit } from "@src/infra/db/entity/unit/unit";
import { Department } from "@src/infra/db/entity/org/department";

async function main() {
  try {
    const orgRepository = db.getRepository(Org);
    const departmentRepository = db.getRepository(Department);
    const unitRepository = db.getRepository(Unit);

    const { unit, org } = await db.transaction(async (tx) => {
      const org = await orgRepository.save(
        orgRepository.create({
          name: "Test Org",
        }),
      );
      const department = await departmentRepository.save(
        departmentRepository.create({
          org: org,
        }),
      );

      const unit = await unitRepository.save(
        unitRepository.create({
          name: "Test Unit",
          department: department,
        }),
      );

      return { org, department, unit };
    });

    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);

    console.log(
      `Successfully wrote unit ID to .env file for tenant ${org.id}`,
    );
    exit(0);
  } catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    throw new Error(`Seed failed: ${e}`);
  }
}

main();