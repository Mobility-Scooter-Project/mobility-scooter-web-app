import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "missing JWT_SECRET";
export const ENVIRONMENT = process.env.ENVIRONMENT || "missing ENVIRONMENT";
export const BASE_URL = process.env.BASE_URL || "missing BASE_URL";

// Services
export const DATABASE_URL = process.env.DATABASE_URL || "missing DATABASE_URL";
export const KV_URL = process.env.KV_URL || "missing KV_URL";

export const STORAGE_URL = process.env.STORAGE_URL || "missing STORAGE_URL";
export const STORAGE_PORT = process.env.STORAGE_PORT || "missing STORAGE_PORT";
export const STORAGE_ACCESS_KEY =
  process.env.STORAGE_ACCESS_KEY || "missing STORAGE_ACCESS_KEY";
export const STORAGE_SECRET_KEY =
  process.env.STORAGE_SECRET_KEY || "missing STORAGE_SECRET_KEY";

export const QUEUE_URL = process.env.QUEUE_URL || "missing QUEUE_URL";

export const SMTP_HOST = process.env.SMTP_HOST || "missing SMTP_HOST";

export const VAULT_ADDR = process.env.VAULT_ADDR || "missing VAULT_ADDR";
export const VAULT_TOKEN = process.env.VAULT_TOKEN || "missing VAULT_TOKEN";
