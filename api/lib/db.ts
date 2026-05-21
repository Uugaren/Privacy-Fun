import { createPool } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema/index.js";

const pool = createPool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
