import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertJournalSchema } from "@shared/schema";
import { generateTradeInsights } from "./ai";
import { z } from "zod";
import { setupAuth } from "./auth";
import fetch from "node-fetch";

const generateInsightsSchema = z.object({
  userId: z.number(),
});

export function registerRoutes(app: Express) {
  // Set up authentication routes and middleware
  setupAuth(app);

  // Authentication middleware for API routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Add the balance update endpoint
  app.patch("/api/user/balance", requireAuth, async (req, res) => {
    try {
      const { balance } = req.body;
      if (!balance || isNaN(Number(balance))) {
        return res.status(400).json({ error: "Invalid balance value" });
      }

      await storage.updateUserBalance(req.user!.id, balance);
      const updatedUser = await storage.getUser(req.user!.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating balance:", error);
      res.status(500).json({ error: "Failed to update balance" });
    }
  });

  // Token information endpoint with better error handling
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
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: data.image_uri,
        marketCap: data.market_cap,
        totalSupply: data.total_supply,
      };

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
  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const trade = insertTradeSchema.parse({
        ...req.body,
        userId: req.user!.id, // Always use the authenticated user's ID
      });
      const result = await storage.createTrade(trade);

      // Calculate the impact on user's balance
      const tradePnL = Number(trade.sellAmount || 0) - Number(trade.buyAmount);
      const user = await storage.getUser(req.user!.id);
      if (user) {
        const newBalance = (Number(user.accountBalance) + tradePnL).toString();
        await storage.updateUserBalance(req.user!.id, newBalance);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid trade data" });
    }
  });

  app.get("/api/trades/:userId", requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      // Only allow users to access their own trades
      if (userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const trades = await storage.getTradesByUser(userId);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Add the new PATCH endpoint for updating trades
  app.patch("/api/trades/:id", requireAuth, async (req, res) => {
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
  app.delete("/api/trades/:id", requireAuth, async (req, res) => {
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
  app.post("/api/journals", requireAuth, async (req, res) => {
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

  app.get("/api/journals/:userId", requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      // Only allow users to access their own journals
      if (userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const journals = await storage.getJournalsByUser(userId);
      res.json(journals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journals" });
    }
  });

  // Insights
  app.post("/api/insights/generate", requireAuth, async (req, res) => {
    try {
      const { userId } = generateInsightsSchema.parse(req.body);
      // Only allow users to generate insights for their own trades
      if (userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const trades = await storage.getTradesByUser(userId);
      if (!trades.length) {
        return res.status(400).json({ error: "No trades available for analysis" });
      }

      const insight = await generateTradeInsights(trades);
      const result = await storage.createInsight({
        userId,
        content: insight,
      });
      res.json(result);
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.get("/api/insights/:userId", requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      // Only allow users to access their own insights
      if (userId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const insights = await storage.getInsightsByUser(userId);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}