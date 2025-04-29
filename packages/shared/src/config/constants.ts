import dotenv from "dotenv";

// NOTE: These are read from the .env file in each package
dotenv.config();

export const QUEUE_URL = process.env.QUEUE_URL || "missing QUEUE_URL";
export const ENVIRONMENT = process.env.ENVIRONMENT || "development";