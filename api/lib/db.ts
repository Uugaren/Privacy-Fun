import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema/index.js";

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
