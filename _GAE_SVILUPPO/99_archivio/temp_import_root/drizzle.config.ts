import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST || "corsi.abreve.it",
    user: process.env.DB_USER || "admincourse",
    password: process.env.DB_PASSWORD || "L#oa8t6d&n9zgKjO",
    database: process.env.DB_NAME || "course",
  },
});
