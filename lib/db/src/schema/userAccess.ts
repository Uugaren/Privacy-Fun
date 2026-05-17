import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userAccessTable = pgTable("user_access", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  email: text("email").notNull(),
  externalOrderId: text("external_order_id").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

export const insertUserAccessSchema = createInsertSchema(userAccessTable).omit({
  id: true,
  grantedAt: true,
});

export type InsertUserAccess = z.infer<typeof insertUserAccessSchema>;
export type UserAccess = typeof userAccessTable.$inferSelect;
