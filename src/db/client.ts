import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "../config/constants";
import * as auth from "./schema/auth";
import * as videos from "./schema/videos";

export const db = drizzle(DATABASE_URL, {casing: "snake_case", schema: {...auth, ...videos}});