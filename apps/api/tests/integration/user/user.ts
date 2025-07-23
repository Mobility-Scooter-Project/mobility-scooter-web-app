import register from "./register";
import login from "./login";
import resetPassword from "./reset-password";
import refreshToken from "./refresh-token";
import otp from "./otp";
import container, { KVSymbol } from "@src/lib/container";
import Redis from "ioredis";


export default () => describe("User", () => {
  beforeEach(async () => {
    const kv = await container.getAsync<Redis>(KVSymbol);
    await kv.flushall();
  });

  register();
  login();
  refreshToken();
  resetPassword();
  otp();

  afterAll(async () => {
    const kv = await container.getAsync<Redis>(KVSymbol);
    await kv.flushall();
  });
});
