import dotenv from "dotenv";
dotenv.config();

export const DATABASE_URL = process.env.DATABASE_URL || "missing DATABASE_URL";
export const JWT_SECRET = process.env.JWT_SECRET || "missing JWT_SECRET";
