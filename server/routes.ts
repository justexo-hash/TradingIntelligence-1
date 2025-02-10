import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertJournalSchema } from "@shared/schema";
import { generateTradeInsights } from "./ai";
import { z } from "zod";
import { setupAuth } from "./auth";

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

  // Trades
  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const trade = insertTradeSchema.parse({
        ...req.body,
        userId: req.user!.id, // Always use the authenticated user's ID
      });
      const result = await storage.createTrade(trade);
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