import { eq, sql, and } from "drizzle-orm";
import { trades, journals, insights, users, sharedTrades, achievements, resources, tradeReviews, trackedWallets, sessions, tokenSummaries } from "@shared/schema";
import type { User, Trade, Journal, Insight, SharedTrade, Achievement, Resource, TradeReview, TrackedWallet, ActivePosition, GroupedTradeHistory, TokenSummary, UpsertTokenSummary } from "@shared/schema";
import type { InsertUser, InsertSharedTrade, InsertAchievement, InsertResource, InsertTradeReview, InsertTrackedWallet } from "@shared/schema";
import { db } from "./db";
import { log } from "./vite";

// Define structure for Aggregated Position Data
export interface ActivePosition { /* ... existing fields ... */ }

// Define a type for the aggregation accumulator
interface HistoryAccumulator {
    tokenName: string | null;
    tokenSymbol: string | null;
    tokenImage: string | null;
    totalTokenBought: number;
    totalTokenSold: number;
    totalSolSpent: number;
    totalSolReceived: number;
    lastActivityDate: Date;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, balance: string): Promise<void>;
  updateUserExperience(id: number, experience: number): Promise<void>;
  updateUserPassword(id: number, passwordHash: string): Promise<void>;

  // Trades
  createTrade(trade: Omit<Trade, "id" | "date">): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  updateTrade(id: number, trade: Partial<Omit<Trade, "id" | "date">>): Promise<Trade>;
  deleteTrade(id: number): Promise<void>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getTradesByDate(userId: number, date: Date): Promise<Trade[]>;
  // Check if a trade exists by signature for a user
  tradeExistsBySignature(userId: number, signature: string): Promise<boolean>;

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

  // Tracked Wallets
  createTrackedWallet(wallet: InsertTrackedWallet): Promise<TrackedWallet>;
  getTrackedWalletsByUser(userId: number): Promise<TrackedWallet[]>;
  getTrackedWalletByAddress(userId: number, address: string): Promise<TrackedWallet | undefined>;
  deleteTrackedWallet(userId: number, address: string): Promise<boolean>;

  // Active Positions
  getActivePositionsByUser(userId: number): Promise<ActivePosition[]>;

  // Grouped Trade History
  getGroupedTradeHistoryByUser(userId: number): Promise<GroupedTradeHistory[]>;

  // Token Summaries
  getTokenSummary(userId: number, contractAddress: string): Promise<TokenSummary | undefined>;
  upsertTokenSummary(data: UpsertTokenSummary): Promise<TokenSummary>; // Handles create or update
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async tradeExistsBySignature(userId: number, signature: string): Promise<boolean> {
    const [trade] = await db.select({ id: trades.id })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        eq(trades.transactionSignature, signature)
      ))
      .limit(1);
    return !!trade;
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

  async updateUserPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, id));
  }

  // --- Tracked Wallet Methods ---

  async createTrackedWallet(wallet: InsertTrackedWallet): Promise<TrackedWallet> {
    const [newWallet] = await db.insert(trackedWallets).values(wallet).returning();
    return newWallet;
  }

  async getTrackedWalletsByUser(userId: number): Promise<TrackedWallet[]> {
    return db.select().from(trackedWallets).where(eq(trackedWallets.userId, userId)).orderBy(trackedWallets.createdAt);
  }

  async getTrackedWalletByAddress(userId: number, address: string): Promise<TrackedWallet | undefined> {
    const [wallet] = await db.select()
      .from(trackedWallets)
      .where(and(
        eq(trackedWallets.userId, userId),
        eq(trackedWallets.address, address)
      ));
    return wallet;
  }

  async deleteTrackedWallet(userId: number, address: string): Promise<boolean> {
    const result = await db.delete(trackedWallets)
      .where(and(
        eq(trackedWallets.userId, userId),
        eq(trackedWallets.address, address)
      ));
    // Check if any row was actually deleted
    // Note: Drizzle's delete result might vary by driver; adjust if needed.
    // Assuming result indicates rows affected or similar
    return (result?.rowCount ?? 0) > 0; // Safely check rowCount
  }

  // --- Active Position Calculation ---
  async getActivePositionsByUser(userId: number): Promise<ActivePosition[]> {
    // Fetch all trades for the user
    const userTrades = await db.select().from(trades).where(eq(trades.userId, userId));

    // Aggregate in memory
    const positions: { [key: string]: Omit<ActivePosition, 'userId' | 'contractAddress' | 'avgBuyPriceSol' | 'realizedPnlSol'> & { tokenBoughtRaw: number; solSpentRaw: number } } = {};

    for (const trade of userTrades) {
      const key = trade.contractAddress;
      if (!positions[key]) {
        positions[key] = {
          tokenName: trade.tokenName,
          tokenSymbol: trade.tokenSymbol,
          tokenImage: trade.tokenImage,
          totalTokenBought: "0",
          totalTokenSold: "0",
          remainingTokenAmount: "0",
          totalSolSpent: "0",
          totalSolReceived: "0",
          tokenBoughtRaw: 0,
          solSpentRaw: 0,
        };
      }

      const position = positions[key];
      const tokenAmount = parseFloat(trade.tokenAmount || "0"); // tokenAmount should not be null based on schema+fetcher
      const solBuyAmount = parseFloat(trade.buyAmount || "0");
      const solSellAmount = parseFloat(trade.sellAmount || "0");

      if (solBuyAmount > 0) { // This was a buy trade
        position.totalTokenBought = (parseFloat(position.totalTokenBought) + tokenAmount).toString();
        position.totalSolSpent = (parseFloat(position.totalSolSpent) + solBuyAmount).toString();
        position.tokenBoughtRaw += tokenAmount;
        position.solSpentRaw += solBuyAmount;
      } else if (solSellAmount > 0) { // This was a sell trade
        position.totalTokenSold = (parseFloat(position.totalTokenSold) + tokenAmount).toString();
        position.totalSolReceived = (parseFloat(position.totalSolReceived) + solSellAmount).toString();
      }
    }

    // Calculate remaining amounts, PNL, Avg Price and format
    const result: ActivePosition[] = Object.entries(positions)
      .map(([contractAddress, pos]) => {
        const remaining = parseFloat(pos.totalTokenBought) - parseFloat(pos.totalTokenSold);
        // Avoid division by zero
        const avgBuyPrice = pos.tokenBoughtRaw > 0 ? (pos.solSpentRaw / pos.tokenBoughtRaw).toFixed(9) : null; // Using more precision for avg price
        const realizedPnl = parseFloat(pos.totalSolReceived) - parseFloat(pos.totalSolSpent);
        
        // Only return positions with a remaining balance > 0 (or a small epsilon)
        if (remaining > 0.000001) {
            return {
                userId,
                contractAddress,
                tokenName: pos.tokenName,
                tokenSymbol: pos.tokenSymbol,
                tokenImage: pos.tokenImage,
                totalTokenBought: pos.totalTokenBought,
                totalTokenSold: pos.totalTokenSold,
                remainingTokenAmount: remaining.toString(),
                totalSolSpent: pos.totalSolSpent,
                totalSolReceived: pos.totalSolReceived,
                avgBuyPriceSol: avgBuyPrice,
                realizedPnlSol: realizedPnl.toString(), // Note: This is PNL for *all* trades of this token, not just realized from sales vs buys
            };
        }
        return null; 
      })
      .filter((p): p is ActivePosition => p !== null); // Filter out nulls and type guard

    return result;
  }

  // --- Grouped Trade History Calculation ---
  async getGroupedTradeHistoryByUser(userId: number): Promise<GroupedTradeHistory[]> {
    log(`[GroupedHistory] Fetching trades for user ${userId}`);
    const userTrades = await db.select().from(trades).where(eq(trades.userId, userId));
    log(`[GroupedHistory] Found ${userTrades.length} raw trades for user ${userId}`);

    // Use the specific accumulator type
    const history: { [key: string]: HistoryAccumulator } = {};

    for (const trade of userTrades) {
      try { 
          const key = trade.contractAddress;
          // Log the date of the trade being processed
          log(`[GroupedHistory] Processing trade ${trade.id} with date: ${trade.date}`); 
          
          if (!history[key]) {
            // Initialize accumulator with correct types
            history[key] = {
              tokenName: trade.tokenName,
              tokenSymbol: trade.tokenSymbol,
              tokenImage: trade.tokenImage,
              totalTokenBought: 0,
              totalTokenSold: 0,
              totalSolSpent: 0,
              totalSolReceived: 0,
              lastActivityDate: trade.date,
            };
          }

          const item = history[key];
          log(`[GroupedHistory] Processing trade ${trade.id}, tokenAmount: ${trade.tokenAmount}, buyAmount: ${trade.buyAmount}, sellAmount: ${trade.sellAmount}`);
          const tokenAmount = parseFloat(trade.tokenAmount || "0");
          const solBuyAmount = parseFloat(trade.buyAmount || "0");
          const solSellAmount = parseFloat(trade.sellAmount || "0");
          
          if (isNaN(tokenAmount) || isNaN(solBuyAmount) || isNaN(solSellAmount)) {
              log(`[GroupedHistory] Found NaN amounts for trade ${trade.id}. Skipping this trade.`);
              continue; 
          }

          // Calculations use numbers directly
          if (solBuyAmount > 0) { 
            item.totalTokenBought += tokenAmount;
            item.totalSolSpent += solBuyAmount;
          } else if (solSellAmount > 0) { 
            item.totalTokenSold += tokenAmount;
            item.totalSolReceived += solSellAmount;
          }

          // Update last activity date if this trade is newer
          if (trade.date > item.lastActivityDate) {
            log(`[GroupedHistory] Updating lastActivityDate for ${key} from ${item.lastActivityDate} to ${trade.date}`);
            item.lastActivityDate = trade.date;
          }
      } catch (innerError) {
          log(`[GroupedHistory] Error processing individual trade ${trade?.id}: ${innerError}`);
          continue; 
      }
    }

    log(`[GroupedHistory] Aggregated ${Object.keys(history).length} tokens`);

    // Map the accumulator results
    const mappedResults = Object.entries(history)
      .map(([contractAddress, item]): GroupedTradeHistory | null => { 
         try { 
            const realizedPnl = item.totalSolReceived - item.totalSolSpent;
            return {
                userId,
                contractAddress,
                tokenName: item.tokenName,
                tokenSymbol: item.tokenSymbol,
                tokenImage: item.tokenImage,
                totalTokenBought: item.totalTokenBought.toString(), 
                totalTokenSold: item.totalTokenSold.toString(),
                totalSolSpent: item.totalSolSpent.toString(),
                totalSolReceived: item.totalSolReceived.toString(),
                realizedPnlSol: realizedPnl.toString(), 
                lastActivityDate: item.lastActivityDate,
            };
         } catch (mapError) {
            log(`[GroupedHistory] Error mapping final result for ${contractAddress}: ${mapError}`);
            return null; 
         }
      });
      
    // Filter out null values explicitly
    const validResults = mappedResults.filter(p => p !== null);

    // Sort the valid results (now guaranteed to be GroupedTradeHistory[])
    const sortedResults = (validResults as GroupedTradeHistory[]).sort((a, b) => {
        // Defensive check for date objects, though filtering nulls should prevent issues
        const timeA = a?.lastActivityDate?.getTime() ?? 0;
        const timeB = b?.lastActivityDate?.getTime() ?? 0;
        return timeB - timeA; 
    });

    log(`[GroupedHistory] Returning ${sortedResults.length} grouped history items for user ${userId}`);
    return sortedResults;
  }
  // --- End Grouped Trade History Calculation ---

  // --- Token Summary Methods ---
  async getTokenSummary(userId: number, contractAddress: string): Promise<TokenSummary | undefined> {
    const [summary] = await db.select()
      .from(tokenSummaries)
      .where(and(
        eq(tokenSummaries.userId, userId),
        eq(tokenSummaries.contractAddress, contractAddress)
      ));
    return summary;
  }

  async upsertTokenSummary(data: UpsertTokenSummary): Promise<TokenSummary> {
    // Use Drizzle's insert...onConflictDoUpdate to handle insert or update
    const [result] = await db.insert(tokenSummaries)
      .values(data)
      .onConflictDoUpdate({
        target: [tokenSummaries.userId, tokenSummaries.contractAddress], // Unique constraint columns
        set: { // Fields to update on conflict (excluding keys and createdAt)
          notes: data.notes,
          setup: data.setup,
          emotion: data.emotion,
          mistakes: data.mistakes,
          updatedAt: new Date(), // Manually set updatedAt on conflict
        }
      })
      .returning(); // Return the inserted or updated row
    return result;
  }
  // --- End Token Summary Methods ---
}

export const storage = new DatabaseStorage();