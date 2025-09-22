
const config = () => ({
  jwtSecret: process.env.JWT_SECRET || "missing JWT_SECRET",
  baseUrl: process.env.BASE_URL || "missing BASE_URL",
  environment: process.env.ENVIRONMENT || "development",
  
  // Services
  database: {
    url: process.env.DATABASE_URL || "missing DATABASE_URL"
  },
  
  kv: {
    url: process.env.KV_URL || "missing KV_URL"
  },
  
  storage: {
    hostname: process.env.STORAGE_HOSTNAME || "missing STORAGE_HOSTNAME",
    secret: process.env.STORAGE_SECRET || "missing STORAGE_SECRET",
    port: Number(process.env.STORAGE_PORT) || 9000,
    accessKey: process.env.STORAGE_ACCESS_KEY || "missing STORAGE_ACCESS_KEY",
    secretKey: process.env.STORAGE_SECRET_KEY || "missing STORAGE_SECRET_KEY",
    bucket: (process.env.ENVIRONMENT || "development") === "production" ? "prod" : "dev"
  },
  
  smtp: {
    host: process.env.SMTP_HOST || "missing SMTP_HOST"
  },
  
  vault: {
    url: process.env.VAULT_URL || "missing VAULT_URL"
  },
  
  keystone: {
    url: process.env.KEYSTONE_URL || "missing KEYSTONE_URL",
    clientId: process.env.KEYSTONE_CLIENT_ID || "missing KEYSTONE_CLIENT_ID",
    clientSecret: process.env.KEYSTONE_CLIENT_SECRET || "missing KEYSTONE_CLIENT_SECRET"
  },
  
  broker: {
    url: process.env.BROKER_URL || "missing BROKER_URL"
  }
});

export type AppConfig = ReturnType<typeof config>;
export default config;