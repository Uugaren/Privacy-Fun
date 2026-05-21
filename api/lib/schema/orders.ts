import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  amount: integer("amount"),
  rawPayload: text("raw_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
