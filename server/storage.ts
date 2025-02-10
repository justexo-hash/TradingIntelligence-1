import { eq } from "drizzle-orm";
import { trades, journals, insights, users } from "@shared/schema";
import type { User, Trade, Journal, Insight } from "@shared/schema";
import type { InsertUser } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<void>;

  // Trades
  createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  updateTrade(id: number, trade: Omit<Trade, "id" | "date">): Promise<Trade>;
  deleteTrade(id: number): Promise<void>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getTradesByDate(userId: number, date: Date): Promise<Trade[]>;

  // Journals
  createJournal(journal: Omit<Journal, "id" | "date">): Promise<Journal>;
  getJournalsByUser(userId: number): Promise<Journal[]>;

  // Insights
  createInsight(insight: Omit<Insight, "id" | "date">): Promise<Insight>;
  getInsightsByUser(userId: number): Promise<Insight[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, balance: string): Promise<void> {
    await db.update(users)
      .set({ accountBalance: balance })
      .where(eq(users.id, id));
  }

  async createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async updateTrade(id: number, trade: Omit<Trade, "id" | "date">): Promise<Trade> {
    const [updatedTrade] = await db
      .update(trades)
      .set(trade)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<void> {
    await db.delete(trades).where(eq(trades.id, id));
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return db.select().from(trades).where(eq(trades.userId, userId));
  }

  async getTradesByDate(userId: number, date: Date): Promise<Trade[]> {
    return db.select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .where(eq(trades.date, date));
  }

  async createJournal(journal: Omit<Journal, "id" | "date">): Promise<Journal> {
    const [newJournal] = await db.insert(journals).values(journal).returning();
    return newJournal;
  }

  async getJournalsByUser(userId: number): Promise<Journal[]> {
    return db.select().from(journals).where(eq(journals.userId, userId));
  }

  async createInsight(insight: Omit<Insight, "id" | "date">): Promise<Insight> {
    const [newInsight] = await db.insert(insights).values(insight).returning();
    return newInsight;
  }

  async getInsightsByUser(userId: number): Promise<Insight[]> {
    return db.select().from(insights).where(eq(insights.userId, userId));
  }
}

export const storage = new DatabaseStorage();