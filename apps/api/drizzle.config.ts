import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infra/db/schema/*",
  schemaFilter: ["auth", "storage", "tenants", "public"],
  out: "./src/infra/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case",
  entities: {
    roles: {
      exclude: ["pg_database_owner"]
    }
  }
});
