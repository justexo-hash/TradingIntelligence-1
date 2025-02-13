import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertJournalSchema, insertSharedTradeSchema } from "@shared/schema";
import { generateTradeInsights } from "./ai";
import { z } from "zod";
import { setupAuth } from "./auth";
import fetch from "node-fetch";
import { AuthenticatedRequest } from "./types";
import { Response, NextFunction } from "express";

const generateInsightsSchema = z.object({
  userId: z.number(),
});

export function registerRoutes(app: Express) {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Authentication middleware for API routes
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Update balance endpoint
  app.patch("/api/user/balance", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { balance } = req.body;
      if (!balance || isNaN(Number(balance))) {
        return res.status(400).json({ error: "Invalid balance value" });
      }

      console.log('Balance update request:', { userId: req.user!.id, newBalance: balance });
      await storage.updateUserBalance(req.user!.id, balance);
      const updatedUser = await storage.getUser(req.user!.id);
      console.log('User after balance update:', updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Update the token information endpoint
  app.get("/api/token/:contractAddress", async (req, res) => {
    try {
      const { contractAddress } = req.params;

      // Log the request attempt
      console.log(`Attempting to fetch token info for address: ${contractAddress}`);

      const response = await fetch(`https://frontend-api.pump.fun/coins/${contractAddress}?sync=true`, {
        headers: {
          'Accept': '*/*'
        }
      });

      // Log the raw response
      const responseText = await response.text();
      console.log("Raw API Response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        return res.status(500).json({
          error: "Invalid response from token API",
          details: "Response was not valid JSON",
          timestamp: new Date().toISOString()
        });
      }

      // Check for rate limit errors
      const rateLimit = {
        limit: response.headers.get('x-ratelimit-limit'),
        remaining: response.headers.get('x-ratelimit-remaining'),
        reset: response.headers.get('x-ratelimit-reset')
      };

      if (!response.ok) {
        console.error("Token lookup failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
          rateLimit,
          contractAddress
        });

        // If we hit rate limit, send a specific error
        if (response.status === 429) {
          return res.status(429).json({
            error: "Rate limit exceeded",
            details: `Please try again in ${rateLimit.reset} seconds`,
            timestamp: new Date().toISOString()
          });
        }

        return res.status(response.status).json({
          error: "Failed to fetch token info",
          details: data.message || response.statusText,
          timestamp: new Date().toISOString()
        });
      }

      // For successful responses, return relevant token data
      const tokenData = {
        name: data.name || null,
        symbol: data.symbol || null,
        image: data.image_uri || null,
        description: data.description || null,
        usdMarketCap: data.usd_market_cap ? `$${Number(data.usd_market_cap).toLocaleString()}` : 'N/A',
        price: data.price ? `$${Number(data.price).toFixed(4)}` : 'N/A',
        volume24h: data.volume_24h ? `$${Number(data.volume_24h).toLocaleString()}` : 'N/A'
      };

      console.log("Processed token data:", tokenData);
      res.json(tokenData);
    } catch (error) {
      console.error("Error fetching token info:", error);
      res.status(500).json({
        error: "Failed to fetch token information",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Trades
  app.get("/api/trades", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const trades = await storage.getTradesByUser(req.user!.id);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // First fetch token info to get the name and symbol
      const response = await fetch(`https://frontend-api.pump.fun/coins/${req.body.contractAddress}?sync=true`);
      const tokenData = await response.json();

      const trade = insertTradeSchema.parse({
        ...req.body,
        userId: req.user!.id,
        tokenName: tokenData.name || null,
        tokenSymbol: tokenData.symbol || null,
        tokenImage: tokenData.image_uri || null,
      });

      console.log('Creating trade:', trade);
      const result = await storage.createTrade(trade);
      console.log('Trade created:', result);

      // Update user balance based on trade P&L
      const tradePnL = Number(trade.sellAmount || 0) - Number(trade.buyAmount);
      const user = await storage.getUser(req.user!.id);
      console.log('Current user state:', user);

      if (user) {
        const currentBalance = Number(user.accountBalance || 0);
        const newBalance = (currentBalance + tradePnL).toFixed(4);
        console.log('Balance calculation:', { currentBalance, tradePnL, newBalance });

        await storage.updateUserBalance(req.user!.id, newBalance);
        const updatedUser = await storage.getUser(req.user!.id);
        console.log('User after balance update:', updatedUser);
      }

      res.json(result);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(400).json({ error: "Invalid trade data" });
    }
  });


  app.patch("/api/trades/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tradeId = Number(req.params.id);
      const trade = await storage.getTrade(tradeId);

      // Check if trade exists and belongs to the authenticated user
      if (!trade || trade.userId !== req.user!.id) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const updatedTrade = insertTradeSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const result = await storage.updateTrade(tradeId, updatedTrade);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid trade data" });
    }
  });

  // Add the new DELETE endpoint for trades
  app.delete("/api/trades/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  });


  // Journals
  app.get("/api/journals", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const journals = await storage.getJournalsByUser(req.user!.id);
      res.json(journals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journals" });
    }
  });

  app.post("/api/journals", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
  });

  // Insights
  app.post("/api/insights/generate", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const trades = await storage.getTradesByUser(req.user!.id);
      if (!trades.length) {
        return res.status(400).json({ error: "No trades available for analysis" });
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
  });

  app.get("/api/insights", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const insights = await storage.getInsightsByUser(req.user!.id);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  // Shared Trades
  app.post("/api/shared-trades", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
        outcome: (Number(trade.sellAmount) - Number(trade.buyAmount)).toString(),
        analysis: req.body.analysis,
      });

      // Mark the original trade as shared
      await storage.updateTrade(trade.id, { ...trade, isShared: true });

      const result = await storage.createSharedTrade(sharedTrade);

      // Award experience points for sharing
      const user = await storage.getUser(req.user!.id);
      if (user) {
        await storage.updateUserExperience(user.id, (user.experience || 0) + 10);
      }

      res.json(result);
    } catch (error) {
      console.error("Error sharing trade:", error);
      res.status(400).json({ error: "Invalid trade data" });
    }
  });

  app.get("/api/shared-trades", async (req, res) => {
    try {
      const trades = await storage.getSharedTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared trades" });
    }
  });

  app.post("/api/shared-trades/:id/like", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const trade = await storage.getSharedTrade(Number(req.params.id));
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const likedBy = trade.likedBy || [];
      if (likedBy.includes(req.user!.id)) {
        return res.status(400).json({ error: "You have already liked this trade" });
      }

      await storage.updateSharedTradeLikes(Number(req.params.id), req.user!.id);
      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Failed to like trade" });
    }
  });

  app.post("/api/shared-trades/:id/comment", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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
        await storage.updateUserExperience(user.id, (user.experience || 0) + 2);
      }

      res.sendStatus(200);
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}