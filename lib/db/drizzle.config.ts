import { defineConfig } from "drizzle-kit";
import path from "path";

const schemaPath = path.resolve(__dirname, "./src/schema/index.ts");

export default defineConfig({
  schema: schemaPath,
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
});