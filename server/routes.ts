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

  // Trades
  app.post("/api/trades", async (req, res) => {
    try {
      const trade = insertTradeSchema.parse(req.body);
      const result = await storage.createTrade(trade);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid trade data" });
    }
  });

  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const trades = await storage.getTradesByUser(Number(req.params.userId));
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // Journals
  app.post("/api/journals", async (req, res) => {
    try {
      const journal = insertJournalSchema.parse(req.body);
      const result = await storage.createJournal(journal);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid journal data" });
    }
  });

  app.get("/api/journals/:userId", async (req, res) => {
    try {
      const journals = await storage.getJournalsByUser(Number(req.params.userId));
      res.json(journals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journals" });
    }
  });

  // Insights
  app.post("/api/insights/generate", async (req, res) => {
    try {
      const { userId } = generateInsightsSchema.parse(req.body);
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

  app.get("/api/insights/:userId", async (req, res) => {
    try {
      const insights = await storage.getInsightsByUser(Number(req.params.userId));
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}