import { pgTable, text, serial, integer, decimal, timestamp, boolean, json, jsonb, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Add ActivePosition Interface --- 
export interface ActivePosition {
  userId: number;
  contractAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenImage: string | null;
  totalTokenBought: string;
  totalTokenSold: string;
  remainingTokenAmount: string;
  totalSolSpent: string;
  totalSolReceived: string;
  avgBuyPriceSol: string | null; // Calculated as totalSolSpent / totalTokenBought
  realizedPnlSol: string;
}
// --- End ActivePosition Interface ---

// --- Add GroupedTradeHistory Interface --- 
export interface GroupedTradeHistory {
  userId: number;
  contractAddress: string;
  tokenName: string | null;
  tokenSymbol: string | null;
  tokenImage: string | null;
  totalTokenBought: string;
  totalTokenSold: string;
  totalSolSpent: string; 
  totalSolReceived: string; 
  realizedPnlSol: string; 
  lastActivityDate: Date; // Timestamp of the most recent trade for this token
}
// --- End GroupedTradeHistory Interface ---

// Update users table to remove Firebase fields and add password
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
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
  tokenAmount: decimal("token_amount").notNull().default("0"),
  setup: text("setup").array(),
  emotion: text("emotion").array(),
  mistakes: text("mistakes").array(),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
  isShared: boolean("is_shared").default(false),
  transactionSignature: text("transaction_signature"),
  source: text("source").default('manual'),
}, (table) => {
  return {
    userSignatureIdx: uniqueIndex("user_signature_idx").on(table.userId, table.transactionSignature),
  };
});

export const sharedTrades = pgTable("shared_trades", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id").notNull(),
  userId: integer("user_id").notNull(),
  tokenName: text("token_name"),
  tokenSymbol: text("token_symbol"),
  setup: text("setup").array(),
  outcome: decimal("outcome"),  // Keep as decimal to maintain data
  analysis: text("analysis"),
  date: timestamp("date").notNull().defaultNow(),
  likes: integer("likes").default(0),
  likedBy: integer("liked_by").array().default([]),
  comments: jsonb("comments").default([]),  // Keep as jsonb
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

export const trackedWallets = pgTable("tracked_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Link to users table
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add definition for connect-pg-simple session table
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6, mode: 'date' }).notNull(),
}, (table) => {
  return {
    expireIdx: index("IDX_session_expire").on(table.expire),
  };
});

// Update insert schema for users to handle password
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true,
  photoURL: true,
}).extend({
  passwordHash: z.string().min(1, "Password hash is required"),
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "displayName is required"),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
  source: z.string().optional(),
  transactionSignature: z.string().optional(),
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
  likedBy: true,
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

export const insertTrackedWalletSchema = createInsertSchema(trackedWallets).omit({
  id: true,
  createdAt: true,
});

// --- Token Summaries Table --- 
export const tokenSummaries = pgTable("token_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contractAddress: text("contract_address").notNull(),
  notes: text("notes"),
  setup: text("setup").array(),
  emotion: text("emotion").array(),
  mistakes: text("mistakes").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userTokenUnique: uniqueIndex("user_token_summary_unique_idx").on(table.userId, table.contractAddress),
  };
});
// --- End Token Summaries Table ---

// Zod schema for inserting/updating token summaries
export const upsertTokenSummarySchema = createInsertSchema(tokenSummaries).omit({
  id: true,        // Exclude auto-generated fields
  createdAt: true,
  updatedAt: true, 
});

export type User = typeof users.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type SharedTrade = typeof sharedTrades.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type TradeReview = typeof tradeReviews.$inferSelect;
export type TrackedWallet = typeof trackedWallets.$inferSelect;
export type TokenSummary = typeof tokenSummaries.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type InsertJournal = z.infer<typeof insertJournalSchema>;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type InsertSharedTrade = z.infer<typeof insertSharedTradeSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertTradeReview = z.infer<typeof insertTradeReviewSchema>;
export type InsertTrackedWallet = z.infer<typeof insertTrackedWalletSchema>;
export type UpsertTokenSummary = z.infer<typeof upsertTokenSummarySchema>;