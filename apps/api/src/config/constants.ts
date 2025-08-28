import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "missing JWT_SECRET";
export const BASE_URL = process.env.BASE_URL || "missing BASE_URL";
export const ENVIRONMENT = process.env.ENVIRONMENT || "development";

// Services
export const DATABASE_URL = process.env.DATABASE_URL || "missing DATABASE_URL";
export const KV_URL = process.env.KV_URL || "missing KV_URL";

export const STORAGE_HOSTNAME = process.env.STORAGE_HOSTNAME || "missing STORAGE_HOSTNAME";
export const STORAGE_SECRET = process.env.STORAGE_SECRET || "missing STORAGE_SECRET";
export const STORAGE_PORT = process.env.STORAGE_PORT || "missing STORAGE_PORT";
export const STORAGE_ACCESS_KEY =
  process.env.STORAGE_ACCESS_KEY || "missing STORAGE_ACCESS_KEY";
export const STORAGE_SECRET_KEY =
  process.env.STORAGE_SECRET_KEY || "missing STORAGE_SECRET_KEY";

export const STORAGE_BUCKET =  ENVIRONMENT == "production" ? "prod" : "dev";

export const SMTP_HOST = process.env.SMTP_HOST || "missing SMTP_HOST";

export const VAULT_URL = process.env.VAULT_URL || "missing VAULT_URL";

export const KEYSTONE_URL = process.env.KEYSTONE_URL || "missing KEYSTONE_URL";
export const KEYSTONE_CLIENT_ID = process.env.KEYSTONE_CLIENT_ID || "missing KEYSTONE_CLIENT_ID";
export const KEYSTONE_CLIENT_SECRET = process.env.KEYSTONE_CLIENT_SECRET || "missing KEYSTONE_CLIENT_SECRET";

export const BROKER_URL = process.env.BROKER_URL || "missing BROKER_URL"