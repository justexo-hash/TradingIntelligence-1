import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  accountBalance: decimal("account_balance").notNull().default("0"),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  buyAmount: decimal("buy_amount").notNull(),
  sellAmount: decimal("sell_amount"),
  setup: text("setup").array(),
  emotion: text("emotion").array(),
  mistakes: text("mistakes").array(),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  folder: text("folder"),
  date: timestamp("date").notNull().defaultNow(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
});

export const insertJournalSchema = createInsertSchema(journals).omit({
  id: true,
  date: true,
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

export type User = typeof users.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type Insight = typeof insights.$inferSelect;