import fs from "fs";
import { exit, } from "process";
import db from "datasource";
import { Org } from "@src/infra/db/entity/org/org";
import { Application } from "@src/infra/db/entity/org/application";
import { Unit } from "@src/infra/db/entity/unit/unit";
import { User } from "@src/infra/db/entity/user/user";
import { APPLICATION_STATUS, IDENTITY_PROVIDERS, USER_ROLES } from "@config/enums";
import { UserIdentity } from "@src/infra/db/entity/user/identity";

async function main() {
  try {
    await db.initialize();
    const orgRepository = db.getRepository(Org);
    const applicationRepository = db.getRepository(Application);
    const unitRepository = db.getRepository(Unit);
    const userRepository = db.getRepository(User);
    const identityRepository = db.getRepository(UserIdentity);

    // If test user already exists, reuse unit/user (idempotent).
    const existingUser = await userRepository.findOne({
      where: { email: "test@example.com" },
      relations: { unit: true },
    });
    if (existingUser?.unit) {
      const unit = existingUser.unit;
      console.log("Test data already exists (test@example.com).");
      console.log(`TESTING_UNIT_ID=${unit.id}`);
      fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);
      exit(0);
    }

    const { unit, org, user } = await db.transaction(async (tx) => {
      const application = await applicationRepository.save(
        applicationRepository.create({
          status: APPLICATION_STATUS.APPROVED,
          statusUpdatedBy: "seed.ts",
          statusMessage: "Seeded application",
        }),
      );

      const org = await orgRepository.save(
        orgRepository.create({
          name: "Test Org",
          location: "Test Location",
          application,
        }),
      );
      const unit = await unitRepository.save(
        unitRepository.create({
          name: "Test Unit",
          org: org,
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

      return { org, unit, user };
    });

    console.log(`Successfully seeded tenant ${org.id}`);
    console.log(`TESTING_UNIT_ID=${unit.id}`);
    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);
    exit(0);
  } catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    throw new Error(`Seed failed: ${e}`);
  }
}

main();