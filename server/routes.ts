import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import {
  insertTradeSchema,
  insertJournalSchema,
  insertSharedTradeSchema,
  insertTrackedWalletSchema,
  upsertTokenSummarySchema,
} from "@shared/schema";
import { generateTradeInsights } from "./ai";
import { z } from "zod";
import { setupAuth } from "./auth";
import fetch from "node-fetch";
import { AuthenticatedRequest } from "./types";
import { Response, NextFunction } from "express";

// SolanaTracker API Key
const API_KEY = '816450d6-d4b7-4497-8c53-d44183f4f647';

const generateInsightsSchema = z.object({
  userId: z.number(),
});

export function registerRoutes(app: Express) {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Authentication middleware for API routes
  const requireAuth = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Update balance endpoint
  app.patch(
    "/api/user/balance",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { balance } = req.body;
        if (!balance || isNaN(Number(balance))) {
          return res.status(400).json({ error: "Invalid balance value" });
        }

        console.log("Balance update request:", {
          userId: req.user!.id,
          newBalance: balance,
        });
        await storage.updateUserBalance(req.user!.id, balance);
        const updatedUser = await storage.getUser(req.user!.id);
        console.log("User after balance update:", updatedUser);
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating balance:", error);
        res.status(500).json({ error: "Failed to update balance" });
      }
    },
  );

  // Update the token information endpoint to use SolanaTracker API
  app.get("/api/token/:contractAddress", async (req, res) => {
    try {
      const { contractAddress } = req.params;

      // Log the request attempt
      console.log(
        `Attempting to fetch token info from SolanaTracker for address: ${contractAddress}`,
      );

      // Fetch token data from SolanaTracker API
      const response = await fetch(`https://data.solanatracker.io/tokens/${contractAddress}`, {
        headers: {
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      });

      // Check if the response is successful
      if (!response.ok) {
        console.warn(`SolanaTracker API request failed with status: ${response.status}`);
        
        // Return basic fallback data when API call fails
        return res.json({
          name: contractAddress.substring(0, 10),
          symbol: contractAddress.substring(0, 4).toUpperCase(),
          image: null,
          description: "Token information currently unavailable",
          usdMarketCap: "N/A",
          price: "N/A",
          volume24h: "N/A"
        });
      }

      // Parse the response
      const data = await response.json();
      console.log("SolanaTracker API response:", data);
      
      // Extract relevant data from the nested structure
      const tokenInfo = data.token || {};
      const poolInfo = data.pools && data.pools.length > 0 ? data.pools[0] : {};
      
      // Format the data to match our expected structure
      const tokenData = {
        name: tokenInfo.name || contractAddress.substring(0, 10),
        symbol: tokenInfo.symbol || contractAddress.substring(0, 4).toUpperCase(),
        image: tokenInfo.image || null,
        description: tokenInfo.description || "No description available",
        usdMarketCap: poolInfo.marketCap?.usd 
          ? `$${Number(poolInfo.marketCap.usd).toLocaleString()}` 
          : "N/A",
        price: poolInfo.price?.usd 
          ? `$${Number(poolInfo.price.usd).toFixed(6)}` 
          : "N/A",
        volume24h: poolInfo.txns?.volume 
          ? `$${Number(poolInfo.txns.volume).toLocaleString()}` 
          : "N/A"
      };

      console.log("Formatted token data:", tokenData);
      res.json(tokenData);
    } catch (error) {
      console.error("Error fetching token info:", error);
      res.status(500).json({
        error: "Failed to fetch token information",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Trades
  app.get(
    "/api/trades",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const trades = await storage.getTradesByUser(req.user!.id);
        res.json(trades);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch trades" });
      }
    },
  );

  app.post(
    "/api/trades",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Initialize default token data
        let tokenData: { name?: string; symbol?: string; image_uri?: string } = {};
        const contractAddress = req.body.contractAddress;
        
        if (contractAddress) {
          try {
            console.log(`Attempting to fetch token info from SolanaTracker for trade creation: ${contractAddress}`);
            
            // Fetch token data from SolanaTracker API
            const response = await fetch(`https://data.solanatracker.io/tokens/${contractAddress}`, {
              headers: {
                'X-API-KEY': API_KEY,
                'Accept': 'application/json'
              },
              // Add timeout to prevent hanging requests
              signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("SolanaTracker API response for trade creation:", data);
              
              // Extract token info from nested structure
              const tokenInfo = data.token || {};
              
              tokenData = {
                name: tokenInfo.name || contractAddress.substring(0, 10),
                symbol: tokenInfo.symbol || contractAddress.substring(0, 4).toUpperCase(),
                image_uri: tokenInfo.image || null
              };
            } else {
              console.warn(`SolanaTracker API request failed with status: ${response.status}`);
              // Fall back to basic token data
              tokenData = {
                name: contractAddress.substring(0, 10),
                symbol: contractAddress.substring(0, 4).toUpperCase(),
                image_uri: null
              };
            }
          } catch (error) {
            console.error("Error fetching token data from SolanaTracker:", error);
            // Fall back to basic token data
            tokenData = {
              name: contractAddress.substring(0, 10),
              symbol: contractAddress.substring(0, 4).toUpperCase(),
              image_uri: null
            };
          }
        }
        
        console.log("Using token data for trade creation:", tokenData);

        const trade = insertTradeSchema.parse({
          ...req.body,
          userId: req.user!.id,
          tokenName: tokenData.name || null,
          tokenSymbol: tokenData.symbol || null,
          tokenImage: tokenData.image_uri || null,
        });

        console.log("Creating trade:", trade);
        const result = await storage.createTrade(trade);
        console.log("Trade created:", result);

        // Update user balance based on trade P&L
        const tradePnL =
          Number(trade.sellAmount || 0) - Number(trade.buyAmount);
        const user = await storage.getUser(req.user!.id);
        console.log("Current user state:", user);

        if (user) {
          const currentBalance = Number(user.accountBalance || 0);
          const newBalance = (currentBalance + tradePnL).toFixed(4);
          console.log("Balance calculation:", {
            currentBalance,
            tradePnL,
            newBalance,
          });

          await storage.updateUserBalance(req.user!.id, newBalance);
          const updatedUser = await storage.getUser(req.user!.id);
          console.log("User after balance update:", updatedUser);
        }

        res.json(result);
      } catch (error) {
        console.error("Error creating trade:", error);
        res.status(400).json({ error: "Invalid trade data" });
      }
    },
  );

  app.patch(
    "/api/trades/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const tradeId = Number(req.params.id);
        const trade = await storage.getTrade(tradeId);

        // Check if trade exists and belongs to the authenticated user
        if (!trade || trade.userId !== req.user!.id) {
          return res.status(404).json({ error: "Trade not found" });
        }

        // If the contract address has changed, update token info
        let tokenName = trade.tokenName;
        let tokenSymbol = trade.tokenSymbol;
        let tokenImage = trade.tokenImage;

        if (
          req.body.contractAddress &&
          req.body.contractAddress !== trade.contractAddress
        ) {
          const contractAddress = req.body.contractAddress;
          
          try {
            console.log(`Attempting to fetch token info from SolanaTracker for trade update: ${contractAddress}`);
            
            // Fetch token data from SolanaTracker API
            const response = await fetch(`https://data.solanatracker.io/tokens/${contractAddress}`, {
              headers: {
                'X-API-KEY': API_KEY,
                'Accept': 'application/json'
              },
              // Add timeout to prevent hanging requests
              signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log("SolanaTracker API response for trade update:", data);
              
              // Extract token info from nested structure
              const tokenInfo = data.token || {};
              
              tokenName = tokenInfo.name || contractAddress.substring(0, 10);
              tokenSymbol = tokenInfo.symbol || contractAddress.substring(0, 4).toUpperCase();
              tokenImage = tokenInfo.image || null;
            } else {
              console.warn(`SolanaTracker API request failed with status: ${response.status}`);
              // Fall back to basic token data
              tokenName = contractAddress.substring(0, 10);
              tokenSymbol = contractAddress.substring(0, 4).toUpperCase();
              tokenImage = null;
            }
          } catch (error) {
            console.error("Error fetching token data from SolanaTracker for update:", error);
            // Fall back to basic token data
            tokenName = contractAddress.substring(0, 10);
            tokenSymbol = contractAddress.substring(0, 4).toUpperCase();
            tokenImage = null;
          }
          
          console.log("Using token data for trade update:", {
            tokenName,
            tokenSymbol,
            tokenImage
          });
        }

        const updatedTrade = insertTradeSchema.parse({
          ...req.body,
          userId: req.user!.id,
          tokenName,
          tokenSymbol,
          tokenImage,
        });

        const result = await storage.updateTrade(tradeId, updatedTrade);
        res.json(result);
      } catch (error) {
        console.error("Error updating trade:", error);
        res.status(400).json({ error: "Invalid trade data" });
      }
    },
  );

  // Add the new DELETE endpoint for trades
  app.delete(
    "/api/trades/:id",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const tradeId = Number(req.params.id);
        const trade = await storage.getTrade(tradeId);

        // Check if trade exists and belongs to the authenticated user
        if (!trade || trade.userId !== req.user!.id) {
          return res.status(404).json({ error: "Trade not found" });
        }

        await storage.deleteTrade(tradeId);
        res.sendStatus(200);
      } catch (error) {
        res.status(500).json({ error: "Failed to delete trade" });
      }
    },
  );

  // Journals
  app.get(
    "/api/journals",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const journals = await storage.getJournalsByUser(req.user!.id);
        res.json(journals);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch journals" });
      }
    },
  );

  app.post(
    "/api/journals",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const journal = insertJournalSchema.parse({
          ...req.body,
          userId: req.user!.id, // Always use the authenticated user's ID
        });
        const result = await storage.createJournal(journal);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: "Invalid journal data" });
      }
    },
  );

  // Insights
  app.post(
    "/api/insights/generate",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const trades = await storage.getTradesByUser(req.user!.id);
        if (!trades.length) {
          return res
            .status(400)
            .json({ error: "No trades available for analysis" });
        }

        const insight = await generateTradeInsights(trades);
        const result = await storage.createInsight({
          userId: req.user!.id,
          content: insight,
        });
        res.json(result);
      } catch (error) {
        console.error("Error generating insights:", error);
        res.status(500).json({ error: "Failed to generate insights" });
      }
    },
  );

  app.get(
    "/api/insights",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const insights = await storage.getInsightsByUser(req.user!.id);
        res.json(insights);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch insights" });
      }
    },
  );

  // Shared Trades
  app.post(
    "/api/shared-trades",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const trade = await storage.getTrade(req.body.tradeId);
        if (!trade || trade.userId !== req.user!.id) {
          return res.status(404).json({ error: "Trade not found" });
        }

        const sharedTrade = insertSharedTradeSchema.parse({
          tradeId: trade.id,
          userId: req.user!.id,
          tokenName: trade.tokenName,
          tokenSymbol: trade.tokenSymbol,
          setup: trade.setup,
          outcome: (
            Number(trade.sellAmount) - Number(trade.buyAmount)
          ).toString(),
          analysis: req.body.analysis,
        });

        // Mark the original trade as shared
        await storage.updateTrade(trade.id, { ...trade, isShared: true });

        const result = await storage.createSharedTrade(sharedTrade);

        // Award experience points for sharing
        const user = await storage.getUser(req.user!.id);
        if (user) {
          await storage.updateUserExperience(
            user.id,
            (user.experience || 0) + 10,
          );
        }

        res.json(result);
      } catch (error) {
        console.error("Error sharing trade:", error);
        res.status(400).json({ error: "Invalid trade data" });
      }
    },
  );

  app.get("/api/shared-trades", async (req, res) => {
    try {
      const trades = await storage.getSharedTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared trades" });
    }
  });

  app.post(
    "/api/shared-trades/:id/like",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const trade = await storage.getSharedTrade(Number(req.params.id));
        if (!trade) {
          return res.status(404).json({ error: "Trade not found" });
        }

        const likedBy = trade.likedBy || [];
        if (likedBy.includes(req.user!.id)) {
          return res
            .status(400)
            .json({ error: "You have already liked this trade" });
        }

        await storage.updateSharedTradeLikes(
          Number(req.params.id),
          req.user!.id,
        );
        res.sendStatus(200);
      } catch (error) {
        res.status(500).json({ error: "Failed to like trade" });
      }
    },
  );

  app.post(
    "/api/shared-trades/:id/comment",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { content } = req.body;
        if (!content) {
          return res.status(400).json({ error: "Comment content is required" });
        }

        await storage.addCommentToSharedTrade(Number(req.params.id), {
          userId: req.user!.id,
          content,
        });

        // Award experience points for commenting
        const user = await storage.getUser(req.user!.id);
        if (user) {
          await storage.updateUserExperience(
            user.id,
            (user.experience || 0) + 2,
          );
        }

        res.sendStatus(200);
      } catch (error) {
        res.status(500).json({ error: "Failed to add comment" });
      }
    },
  );

  // Tracked Wallets
  app.get(
    "/api/wallets",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const wallets = await storage.getTrackedWalletsByUser(req.user!.id);
        res.json(wallets);
      } catch (error) {
        console.error("Error fetching tracked wallets:", error);
        res.status(500).json({ error: "Failed to fetch tracked wallets" });
      }
    }
  );

  app.post(
    "/api/wallets",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Basic Solana address validation (length and base58 characters)
        // A more robust validation might involve specific libraries if needed
        const addressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address format");
        const validationResult = addressSchema.safeParse(req.body.address);

        if (!validationResult.success) {
          return res.status(400).json({ error: validationResult.error.errors[0].message });
        }

        const walletData = insertTrackedWalletSchema.parse({
          userId: req.user!.id,
          address: validationResult.data, // Use validated address
        });

        // Check if wallet already exists for this user
        const existing = await storage.getTrackedWalletByAddress(req.user!.id, walletData.address);
        if (existing) {
          return res.status(409).json({ error: "Wallet address already tracked" });
        }

        const result = await storage.createTrackedWallet(walletData);
        res.status(201).json(result);
      } catch (error) {
        // Handle potential Zod validation errors specifically
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid wallet data", details: error.errors });
        }
        console.error("Error adding tracked wallet:", error);
        res.status(500).json({ error: "Failed to add tracked wallet" });
      }
    }
  );

  app.delete(
    "/api/wallets/:address",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const address = req.params.address;
        // Basic validation for the address from params
        const addressSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana address format");
        const validationResult = addressSchema.safeParse(address);

        if (!validationResult.success) {
          return res.status(400).json({ error: validationResult.error.errors[0].message });
        }

        const deleted = await storage.deleteTrackedWallet(
          req.user!.id,
          validationResult.data
        );

        if (deleted) {
          res.sendStatus(204); // No Content
        } else {
          // Could happen if the wallet address didn't exist for the user
          res.status(404).json({ error: "Tracked wallet not found" });
        }
      } catch (error) {
        console.error("Error deleting tracked wallet:", error);
        res.status(500).json({ error: "Failed to delete tracked wallet" });
      }
    }
  );

  // --- Active Positions Endpoint ---
  app.get(
    "/api/positions",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const positions = await storage.getActivePositionsByUser(req.user!.id);
        res.json(positions);
      } catch (error) {
        console.error("Error fetching active positions:", error);
        res.status(500).json({ error: "Failed to fetch active positions" });
      }
    }
  );
  // --- End Active Positions Endpoint ---

  // --- Grouped Trade History Endpoint ---
  app.get(
    "/api/trades/grouped",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      let history: GroupedTradeHistory[] = []; 
      try {
        history = await storage.getGroupedTradeHistoryByUser(req.user!.id);
        console.log(`[GroupedAPI] Storage returned ${history.length} items for user ${req.user!.id}`);

        if (history.length > 0) {
          console.log(`[GroupedAPI] Sample item BEFORE map:`, history[0]);
        }

        let serializableHistory;
        try {
          serializableHistory = history.map(item => {
            const isoDate = item.lastActivityDate instanceof Date 
              ? item.lastActivityDate.toISOString() 
              : String(item.lastActivityDate);
            // Log the date being serialized for a sample item
            if (item.contractAddress === history[0]?.contractAddress) { // Log first item's date
                 console.log(`[GroupedAPI] Serializing date for ${item.contractAddress}: ${isoDate}`);
            }
            return {
              ...item,
              lastActivityDate: isoDate, 
            };
          });
          if (serializableHistory.length > 0) {
             console.log(`[GroupedAPI] Sample item AFTER map:`, serializableHistory[0]);
          }
        } catch (mappingError) {
           console.error(`[GroupedAPI] Error during date mapping: ${mappingError}`);
           return res.status(500).json({ error: "Failed to process trade history data" });
        }

        console.log(`[GroupedAPI] Attempting to send ${serializableHistory.length} items.`);
        res.json(serializableHistory);

      } catch (error) {
        console.error("Error fetching grouped trade history:", error);
         console.log(`[GroupedAPI] Error occurred after fetching ${history?.length ?? 'unknown'} items from storage.`);
        res.status(500).json({ error: "Failed to fetch grouped trade history" });
      }
    }
  );
  // --- End Grouped Trade History Endpoint ---

  // --- GET Token Summary Endpoint ---
  app.get(
    "/api/trades/summary/:contractAddress",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { contractAddress } = req.params;
        const summary = await storage.getTokenSummary(req.user!.id, contractAddress);
        if (!summary) {
          // Return a default empty summary object if none exists yet
          return res.json({
            userId: req.user!.id,
            contractAddress: contractAddress,
            notes: null,
            setup: [],
            emotion: [],
            mistakes: [],
            // Add createdAt/updatedAt if needed, or keep minimal
          });
        }
        res.json(summary);
      } catch (error) {
        console.error(`Error fetching token summary for ${req.params.contractAddress}:`, error);
        res.status(500).json({ error: "Failed to fetch token summary" });
      }
    }
  );
  // --- End GET Token Summary Endpoint ---

  // --- Upsert Token Summary Endpoint (PATCH) ---
  app.patch(
    "/api/trades/summary/:contractAddress",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { contractAddress } = req.params;
        // Validate payload against schema (only journaling fields)
        const validationResult = upsertTokenSummarySchema.pick({ 
          notes: true, setup: true, emotion: true, mistakes: true 
        }).safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({ error: "Invalid summary data", details: validationResult.error.errors });
        }

        const dataToUpsert: UpsertTokenSummary = {
          userId: req.user!.id,
          contractAddress: contractAddress,
          ...validationResult.data, // Spread validated journaling fields
        };

        const result = await storage.upsertTokenSummary(dataToUpsert);
        res.json(result);
      } catch (error) {
        console.error(`Error upserting token summary for ${req.params.contractAddress}:`, error);
        res.status(500).json({ error: "Failed to save token summary" });
      }
    }
  );
  // --- End Upsert Token Summary Endpoint ---

  const httpServer = createServer(app);
  return httpServer;
}
