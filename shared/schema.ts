import { pgTable, text, serial, integer, decimal, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define all tables first
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  accountBalance: decimal("account_balance").notNull().default("0"),
  experience: integer("experience").notNull().default(0),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
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

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  tokenName: text("token_name"),
  tokenSymbol: text("token_symbol"),
  tokenImage: text("token_image"),
  buyAmount: decimal("buy_amount").notNull(),
  sellAmount: decimal("sell_amount"),
  setup: text("setup").array(),
  emotion: text("emotion").array(),
  mistakes: text("mistakes").array(),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
  isShared: boolean("is_shared").default(false),
});

export const sharedTrades = pgTable("shared_trades", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull(),
  userId: integer("user_id").notNull(),
  tokenName: text("token_name"),
  tokenSymbol: text("token_symbol"),
  setup: text("setup").array(),
  outcome: text("outcome"), // Changed to text
  analysis: text("analysis"),
  date: timestamp("date").notNull().defaultNow(),
  likes: integer("likes").default(0),
  comments: json("comments").default([]),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  earnedDate: timestamp("earned_date").notNull().defaultNow(),
  metadata: json("metadata").default({}),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tradeReviews = pgTable("trade_reviews", {
  id: serial("id").primaryKey(),
  sharedTradeId: integer("shared_trade_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
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

export const insertSharedTradeSchema = createInsertSchema(sharedTrades).omit({
  id: true,
  date: true,
  likes: true,
  comments: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedDate: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeReviewSchema = createInsertSchema(tradeReviews).omit({
  id: true,
  createdAt: true,
  helpful: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type SharedTrade = typeof sharedTrades.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type TradeReview = typeof tradeReviews.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type InsertSharedTrade = z.infer<typeof insertSharedTradeSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertTradeReview = z.infer<typeof insertTradeReviewSchema>;