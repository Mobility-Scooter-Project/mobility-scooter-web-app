import { Hono } from "hono";
import { Variables } from "@src/index";
import videos from "./videos";

const app = new Hono<{ Variables: Variables }>().route("/videos", videos)

export default app;