import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "../config/constants";

export const db = drizzle(DATABASE_URL);