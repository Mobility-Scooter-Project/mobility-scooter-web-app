import { exit } from "process";
import db from "datasource";
import { Org } from "@src/infra/db/entity/org/org";
import { Application } from "@src/infra/db/entity/org/application";
import { Unit } from "@src/infra/db/entity/unit/unit";
import { User } from "@src/infra/db/entity/user/user";
import { UserIdentity } from "@src/infra/db/entity/user/identity";
import { APPLICATION_STATUS, USER_ROLES } from "@config/enums";
import type { Repository } from "typeorm";

const SEED_ORG_NAME = "Casa Colina Hospital";
const SEED_UNIT_NAME = "Research Unit";
const SEED_USER_EMAIL = "test@example.com";
const SEED_USER_PASSWORD = "testing124";

async function main() {
  try {
    await db.initialize();
    const orgRepository = db.getRepository(Org);
    const applicationRepository = db.getRepository(Application);
    const unitRepository = db.getRepository(Unit);
    const userRepository = db.getRepository(User);
    const userIdentityRepository = db.getRepository(UserIdentity);

    const existingUnit = await unitRepository
      .createQueryBuilder("unit")
      .innerJoin("unit.org", "org")
      .where("LOWER(TRIM(org.name)) = LOWER(TRIM(:oname))", {
        oname: SEED_ORG_NAME,
      })
      .andWhere("LOWER(TRIM(unit.name)) = LOWER(TRIM(:uname))", {
        uname: SEED_UNIT_NAME,
      })
      .getOne();

    if (existingUnit) {
      console.log(
        `Seed tenant already exists (${SEED_ORG_NAME} / ${SEED_UNIT_NAME}).`,
      );
      await ensureTestUser(existingUnit, userRepository, userIdentityRepository);
      exit(0);
    }

    const { unit } = await db.transaction(async () => {
      const application = await applicationRepository.save(
        applicationRepository.create({
          status: APPLICATION_STATUS.APPROVED,
          statusUpdatedBy: "seed.ts",
          statusMessage: "Seeded application",
        }),
      );

      const org = await orgRepository.save(
        orgRepository.create({
          name: SEED_ORG_NAME,
          location: "Test Location",
          application,
        }),
      );

      const unit = await unitRepository.save(
        unitRepository.create({
          name: SEED_UNIT_NAME,
          org,
        }),
      );

      return { unit };
    });

    console.log(`Successfully seeded ${SEED_ORG_NAME} / ${SEED_UNIT_NAME}`);
    await ensureTestUser(unit, userRepository, userIdentityRepository);
    exit(0);
  } catch (e) {
    console.error(`Seed failed: ${e}`);
    throw new Error(`Seed failed: ${e}`);
  }
}

async function ensureTestUser(
  unit: Unit,
  userRepository: Repository<User>,
  userIdentityRepository: Repository<UserIdentity>,
) {
  // If test user already exists, reuse unit/user (idempotent).
  const existingUser = await userRepository.findOne({
    where: { email: SEED_USER_EMAIL },
    relations: { unit: true },
  });

  if (existingUser?.unit) {
    console.log(`Test data already exists (${SEED_USER_EMAIL}).`);
    return;
  }

  if (existingUser && !existingUser.unit) {
    await userRepository.update({ id: existingUser.id }, { unit });
    console.log(`Linked existing ${SEED_USER_EMAIL} user to seeded unit.`);
    return;
  }

  const hashResult = await db.query(`SELECT crypt($1, gen_salt('bf')) as hash`, [
    SEED_USER_PASSWORD,
  ]);
  const passwordHash = hashResult[0].hash as string;

  const user = await userRepository.save(
    userRepository.create({
      email: SEED_USER_EMAIL,
      passwordHash,
      role: USER_ROLES.RESEARCHER,
      givenName: "Test",
      surname: "User",
      unit,
    }),
  );

  await userIdentityRepository.save(
    userIdentityRepository.create({
      user,
    }),
  );
  console.log(`Created test user ${SEED_USER_EMAIL} (password: ${SEED_USER_PASSWORD}).`);
}

main();
