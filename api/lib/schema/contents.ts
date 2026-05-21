import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const contentsTable = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("album"),
  price: integer("price"),
  teaserUrl: text("teaser_url"),
  privateFolderKey: text("private_folder_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
