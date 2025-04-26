import { postgresDB } from "../../../src/middleware/db";
import { sql } from "drizzle-orm";
import { kv } from "../../../src/integrations/kv"
import register from "./register";
import { SHARED_DATA } from "@tests/config/constants";
import login from "./login";
import resetPassword from "./reset-password";
import refreshToken from "./refresh-token";
import otp from "./otp";

export default () => describe("User", () => {
  beforeEach(async () => {
    await kv.flushall();
  });

  register();
  login();
  refreshToken();
  resetPassword();
  otp();

  afterAll(async () => {
    await Promise.all([
      kv.flushall(),
    ]);
  });
});
