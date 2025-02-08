import { Trade, Insight } from "@shared/schema";

interface AIResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TradeAnalysis {
  totalTrades: number;
  profitableTrades: number;
  unprofitableTrades: number;
  winRate: number;
  commonSetups: string[];
  commonEmotions: string[];
  commonMistakes: string[];
}

/**
 * Analyzes trade data and generates insights
 */
export async function generateTradeInsights(trades: Trade[]): Promise<Insight> {
  const response = await fetch("/api/insights/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: 1, // TODO: Replace with actual user ID
    }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to generate insights");
  }

  const data = await response.json();
  return data;
}

/**
 * Formats a trade analysis summary from raw trade data
 */
export function formatTradeAnalysis(trades: Trade[]): TradeAnalysis {
  if (!trades.length) {
    return {
      totalTrades: 0,
      profitableTrades: 0,
      unprofitableTrades: 0,
      winRate: 0,
      commonSetups: [],
      commonEmotions: [],
      commonMistakes: [],
    };
  }

  const profitableTrades = trades.filter(
    (trade) => Number(trade.sellAmount) - Number(trade.buyAmount) > 0
  );
  const unprofitableTrades = trades.filter(
    (trade) => Number(trade.sellAmount) - Number(trade.buyAmount) <= 0
  );

  return {
    totalTrades: trades.length,
    profitableTrades: profitableTrades.length,
    unprofitableTrades: unprofitableTrades.length,
    winRate: (profitableTrades.length / trades.length) * 100,
    commonSetups: getCommonItems(trades.flatMap((t) => t.setup?.filter(Boolean) ?? [])),
    commonEmotions: getCommonItems(trades.flatMap((t) => t.emotion?.filter(Boolean) ?? [])),
    commonMistakes: getCommonItems(trades.flatMap((t) => t.mistakes?.filter(Boolean) ?? [])),
  };
}

/**
 * Helper function to get most common items from an array
 */
function getCommonItems(items: string[]): string[] {
  if (!items.length) return [];

  const counts = items.reduce((acc, item) => {
    if (item) {
      acc[item] = (acc[item] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([item]) => item);
}

/**
 * Formats insight content for display
 */
export function formatInsightContent(content: string): string {
  // Remove any system-generated prefixes/suffixes
  const cleanContent = content.replace(/^(Analysis:|Summary:)\s*/i, "").trim();

  // Split into paragraphs for better readability
  return cleanContent.split(/\n{2,}/).join("\n\n");
}