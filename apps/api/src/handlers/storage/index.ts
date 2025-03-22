import type { Variables } from "@src/index";
import { Hono } from "hono";
import videos from "./videos";

const app = new Hono<{ Variables: Variables }>().route("/videos", videos);

export default app;
