import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const userAccessTable = pgTable("user_access", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  email: text("email").notNull(),
  externalOrderId: text("external_order_id").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});
