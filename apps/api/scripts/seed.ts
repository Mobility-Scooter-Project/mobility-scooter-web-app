import fs from "fs";
import { exit, } from "process";
import db from "datasource";
import { Org } from "@src/infra/db/entity/org/org";
import { Unit } from "@src/infra/db/entity/unit/unit";
import { Department } from "@src/infra/db/entity/org/department";
import { User } from "@src/infra/db/entity/user/user";
import { IDENTITY_PROVIDERS, USER_ROLES } from "@config/enums";
import { UserIdentity } from "@src/infra/db/entity/user/identity";

async function main() {
  try {
    await db.initialize();
    const orgRepository = db.getRepository(Org);
    const departmentRepository = db.getRepository(Department);
    const unitRepository = db.getRepository(Unit);
    const userRepository = db.getRepository(User);
    const identityRepository = db.getRepository(UserIdentity);

    const { unit, org } = await db.transaction(async (tx) => {
      const org = await orgRepository.save(
        orgRepository.create({
          name: "Test Org",
          location: "Test Location",
        }),
      );
      const department = await departmentRepository.save(
        departmentRepository.create({
          org: org,
          name: "Test Department",
        }),
      );

      const unit = await unitRepository.save(
        unitRepository.create({
          name: "Test Unit",
          department: department,
        }),
      );

      const passwordHashResult = await db.query(
        `SELECT crypt($1, gen_salt('bf')) as hash`,
        ["testing124"],
      );
      const passwordHash = passwordHashResult[0].hash;

      const user = await userRepository.save(
        userRepository.create({
          email: "test@example.com",
          passwordHash: passwordHash,
          unit: unit,
          givenName: "Test",
          surname: "User",
          role: USER_ROLES.ADMIN
        }),
      );

      await identityRepository.save(
        identityRepository.create({
          user: user,
          provider: IDENTITY_PROVIDERS.EMAIL
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