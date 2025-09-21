import { Hono } from "hono";
import type { Variables } from "src";
import emailpass from "./emailpass";
import otp from "./otp";
import refresh from "./refresh";
import users from "./users";

const app = new Hono<{ Variables: Variables }>()
  .route("/emailpass", emailpass)
  .route("/refresh", refresh)
  .route("/otp", otp)
  .route("/users", users);

export default app;
