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

    // If test user already exists, reuse and only ensure we have a session (idempotent)
    const existingUser = await userRepository.findOne({
      where: { email: "test@example.com" },
      relations: { unit: true },
    });
    if (existingUser?.unit) {
      const unit = existingUser.unit;
      let sessionId: string;
      const existingSession = await db.query(
        `SELECT id FROM videos.patient_session LIMIT 1`,
      );
      if (existingSession?.length > 0) {
        sessionId = existingSession[0].id;
      } else {
        const sessionResult = await db.query(
          `INSERT INTO videos.patient_session ("id", "cudCreatedat") VALUES (uuid_generate_v4(), now()) RETURNING id`,
        );
        sessionId = sessionResult[0].id;
      }
      console.log("Test data already exists (test@example.com).");
      console.log(
        `TESTING_UNIT_ID=${unit.id}\nTESTING_SESSION_ID=${sessionId}`,
      );
      console.log(
        `Use sessionId in POST /videos/upload; patientId can be any UUID (e.g. ${unit.id}).`,
      );
      exit(0);
      return;
    }

    const { unit, org, sessionId } = await db.transaction(async (tx) => {
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

      // One row in patient_session for video upload (Video.sessionId FK)
      const sessionResult = await db.query(
        `INSERT INTO videos.patient_session ("id", "cudCreatedat") VALUES (uuid_generate_v4(), now()) RETURNING id`,
      );
      const sessionId = sessionResult[0].id;

      return { org, department, unit, sessionId };
    });

    fs.appendFileSync(".env", `\nTESTING_UNIT_ID=${unit.id}\n`);
    fs.appendFileSync(".env", `\nTESTING_SESSION_ID=${sessionId}\n`);

    console.log(
      `Successfully wrote unit ID to .env file for tenant ${org.id}`,
    );
    console.log(
      `Test session ID for video upload: ${sessionId}. Use as sessionId in POST /videos/upload; patientId can be any UUID (e.g. ${unit.id}).`,
    );
    exit(0);
  } catch (e) {
    console.error(`Failed to write unit ID to .env file: ${e}`);
    throw new Error(`Seed failed: ${e}`);
  }
}

main();