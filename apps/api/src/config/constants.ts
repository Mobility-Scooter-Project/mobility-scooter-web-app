const config = () => ({
  jwtSecret: process.env.JWT_SECRET || 'missing JWT_SECRET',
  baseUrl: process.env.BASE_URL || 'missing BASE_URL',
  webAppUrl: process.env.WEB_APP_URL || 'missing WEB_APP_URL',
  environment: process.env.ENVIRONMENT || 'development',
  videoWorkerSecret:
    process.env.VIDEO_WORKER_SECRET || 'missing VIDEO_WORKER_SECRET',

  database: {
    host: process.env.DATABASE_HOST || 'missing DATABASE_HOST',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER || 'missing DATABASE_USER',
    password: process.env.DATABASE_PASSWORD || 'missing DATABASE_PASSWORD',
    database: process.env.DATABASE_NAME || 'missing DATABASE_NAME',
  },

  kv: {
    url: process.env.KV_URL || 'missing KV_URL',
  },

  storage: {
    hostname: process.env.STORAGE_HOSTNAME || 'missing STORAGE_HOSTNAME',
    secret: process.env.STORAGE_SECRET || 'missing STORAGE_SECRET',
    port: Number(process.env.STORAGE_PORT) || 9000,
    accessKey: process.env.STORAGE_ACCESS_KEY || 'missing STORAGE_ACCESS_KEY',
    secretKey: process.env.STORAGE_SECRET_KEY || 'missing STORAGE_SECRET_KEY',
    bucket:
      (process.env.ENVIRONMENT || 'development') === 'production'
        ? 'prod'
        : 'dev',
  },

  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: (process.env.MAIL_FROM ?? '') || 'missing MAIL_FROM',
    secure:
      process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
  },

  vault: {
    url: process.env.VAULT_URL || 'missing VAULT_URL',
  },

  keystone: {
    url: process.env.KEYSTONE_URL || 'missing KEYSTONE_URL',
    clientId: process.env.KEYSTONE_CLIENT_ID || 'missing KEYSTONE_CLIENT_ID',
    clientSecret:
      process.env.KEYSTONE_CLIENT_SECRET || 'missing KEYSTONE_CLIENT_SECRET',
  },

  broker: {
    url: process.env.BROKER_URL || 'missing BROKER_URL',
  },
});

export type AppConfig = ReturnType<typeof config>;
export default config;
