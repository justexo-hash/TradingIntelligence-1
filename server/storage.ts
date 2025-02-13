import { eq, sql, and } from "drizzle-orm";
import { trades, journals, insights, users, sharedTrades, achievements, resources, tradeReviews } from "@shared/schema";
import type { User, Trade, Journal, Insight, SharedTrade, Achievement, Resource, TradeReview } from "@shared/schema";
import type { InsertUser, InsertSharedTrade, InsertAchievement, InsertResource, InsertTradeReview } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<void>;
  updateUserExperience(id: number, experience: number): Promise<void>;

  // Trades
  createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  updateTrade(id: number, trade: Partial<Omit<Trade, "id" | "date">>): Promise<Trade>;
  deleteTrade(id: number): Promise<void>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getTradesByDate(userId: number, date: Date): Promise<Trade[]>;

  // Shared Trades
  createSharedTrade(trade: InsertSharedTrade): Promise<SharedTrade>;
  getSharedTrade(id: number): Promise<SharedTrade | undefined>;
  getSharedTrades(): Promise<SharedTrade[]>;
  updateSharedTradeLikes(id: number, userId: number): Promise<void>;
  addCommentToSharedTrade(id: number, comment: { userId: number; content: string }): Promise<void>;

  // Achievements
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getAchievementsByUser(userId: number): Promise<Achievement[]>;

  // Resources
  createResource(resource: InsertResource): Promise<Resource>;
  getResources(): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;

  // Trade Reviews
  createTradeReview(review: InsertTradeReview): Promise<TradeReview>;
  getTradeReviews(sharedTradeId: number): Promise<TradeReview[]>;
  updateTradeReviewHelpful(id: number): Promise<void>;

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

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseId, firebaseId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, balance: string): Promise<void> {
    await db.update(users).set({ accountBalance: balance }).where(eq(users.id, id));
  }

  async updateUserExperience(id: number, experience: number): Promise<void> {
    await db.update(users).set({ experience }).where(eq(users.id, id));
  }

  async createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async updateTrade(id: number, trade: Partial<Omit<Trade, "id" | "date">>): Promise<Trade> {
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
    return db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          eq(trades.date, date)
        )
      );
  }

  async createSharedTrade(trade: InsertSharedTrade): Promise<SharedTrade> {
    const [sharedTrade] = await db.insert(sharedTrades).values(trade).returning();
    return sharedTrade;
  }

  async getSharedTrade(id: number): Promise<SharedTrade | undefined> {
    const [trade] = await db.select().from(sharedTrades).where(eq(sharedTrades.id, id));
    return trade;
  }

  async getSharedTrades(): Promise<SharedTrade[]> {
    return db.select().from(sharedTrades).orderBy(sharedTrades.date);
  }

  async updateSharedTradeLikes(id: number, userId: number): Promise<void> {
    const trade = await this.getSharedTrade(id);
    if (!trade) return;

    const likedBy = trade.likedBy || [];
    if (likedBy.includes(userId)) return;

    await db
      .update(sharedTrades)
      .set({
        likes: sql`${sharedTrades.likes} + 1`,
        likedBy: [...likedBy, userId]
      })
      .where(eq(sharedTrades.id, id));
  }

  async addCommentToSharedTrade(id: number, comment: { userId: number; content: string }): Promise<void> {
    const trade = await this.getSharedTrade(id);
    if (!trade) return;

    const comments = [...(trade.comments as any[] || []), { ...comment, timestamp: new Date() }];
    await db
      .update(sharedTrades)
      .set({ comments })
      .where(eq(sharedTrades.id, id));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async getAchievementsByUser(userId: number): Promise<Achievement[]> {
    return db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db.insert(resources).values(resource).returning();
    return newResource;
  }

  async getResources(): Promise<Resource[]> {
    return db.select().from(resources).orderBy(resources.createdAt);
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.category, category));
  }

  async createTradeReview(review: InsertTradeReview): Promise<TradeReview> {
    const [newReview] = await db.insert(tradeReviews).values(review).returning();
    return newReview;
  }

  async getTradeReviews(sharedTradeId: number): Promise<TradeReview[]> {
    return db.select().from(tradeReviews).where(eq(tradeReviews.sharedTradeId, sharedTradeId));
  }

  async updateTradeReviewHelpful(id: number): Promise<void> {
    await db
      .update(tradeReviews)
      .set({ helpful: sql`${tradeReviews.helpful} + 1` })
      .where(eq(tradeReviews.id, id));
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