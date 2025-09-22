import { defineConfig } from "drizzle-kit"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set")
  process.exit(1)
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case",
});
