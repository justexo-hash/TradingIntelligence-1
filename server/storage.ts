import { trades, journals, insights, users } from "@shared/schema";
import type { User, Trade, Journal, Insight } from "@shared/schema";
import type { InsertUser } from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<void>;
  updateLoginStreak(id: number): Promise<void>;

  // Trades
  createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getTradesByDate(userId: number, date: Date): Promise<Trade[]>;

  // Journals
  createJournal(journal: Omit<Journal, "id" | "date">): Promise<Journal>;
  getJournalsByUser(userId: number): Promise<Journal[]>;

  // Insights
  createInsight(insight: Omit<Insight, "id" | "date">): Promise<Insight>;
  getInsightsByUser(userId: number): Promise<Insight[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private journals: Map<number, Journal>;
  private insights: Map<number, Insight>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.journals = new Map();
    this.insights = new Map();
    this.currentId = { users: 1, trades: 1, journals: 1, insights: 1 };
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, accountBalance: "0", loginStreak: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, balance: string): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { ...user, accountBalance: balance });
    }
  }

  async updateLoginStreak(id: number): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      this.users.set(id, { ...user, loginStreak: user.loginStreak + 1 });
    }
  }

  async createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade> {
    const id = this.currentId.trades++;
    const newTrade: Trade = { ...trade, id, date: new Date() };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId,
    );
  }

  async getTradesByDate(userId: number, date: Date): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      (trade) =>
        trade.userId === userId &&
        trade.date.toDateString() === date.toDateString(),
    );
  }

  async createJournal(journal: Omit<Journal, "id" | "date">): Promise<Journal> {
    const id = this.currentId.journals++;
    const newJournal: Journal = { ...journal, id, date: new Date() };
    this.journals.set(id, newJournal);
    return newJournal;
  }

  async getJournalsByUser(userId: number): Promise<Journal[]> {
    return Array.from(this.journals.values()).filter(
      (journal) => journal.userId === userId,
    );
  }

  async createInsight(insight: Omit<Insight, "id" | "date">): Promise<Insight> {
    const id = this.currentId.insights++;
    const newInsight: Insight = { ...insight, id, date: new Date() };
    this.insights.set(id, newInsight);
    return newInsight;
  }

  async getInsightsByUser(userId: number): Promise<Insight[]> {
    return Array.from(this.insights.values()).filter(
      (insight) => insight.userId === userId,
    );
  }
}

export const storage = new MemStorage();