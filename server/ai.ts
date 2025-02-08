import { Trade } from "@shared/schema";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  throw new Error("PERPLEXITY_API_KEY is required");
}

export async function generateTradeInsights(trades: Trade[]): Promise<string> {
  if (!trades.length) {
    return "No trades available for analysis.";
  }

  const profitableTrades = trades.filter(
    (trade) => Number(trade.sellAmount) - Number(trade.buyAmount) > 0
  );
  const unprofitableTrades = trades.filter(
    (trade) => Number(trade.sellAmount) - Number(trade.buyAmount) <= 0
  );

  // Prepare trade data for analysis
  const tradeAnalysis = {
    totalTrades: trades.length,
    profitableTrades: profitableTrades.length,
    unprofitableTrades: unprofitableTrades.length,
    winRate: (profitableTrades.length / trades.length) * 100,
    commonSetups: getCommonItems(trades.flatMap((t) => t.setup?.filter(Boolean) ?? [])),
    commonEmotions: getCommonItems(trades.flatMap((t) => t.emotion?.filter(Boolean) ?? [])),
    commonMistakes: getCommonItems(trades.flatMap((t) => t.mistakes?.filter(Boolean) ?? [])),
  };

  const prompt = `Analyze the following trading data and provide actionable insights:

Total Trades: ${tradeAnalysis.totalTrades}
Win Rate: ${tradeAnalysis.winRate.toFixed(1)}%
Most Common Setups: ${tradeAnalysis.commonSetups.join(", ")}
Common Emotions: ${tradeAnalysis.commonEmotions.join(", ")}
Common Mistakes: ${tradeAnalysis.commonMistakes.join(", ")}

Please provide:
1. A summary of trading performance
2. Pattern analysis of successful vs unsuccessful trades
3. Emotional state impact on trading decisions
4. Specific recommendations for improvement
Keep the response concise and actionable.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content:
              "You are a professional trading analyst providing insights on trading patterns and behaviors.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate insights");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Failed to generate insights. Please try again later.";
  }
}

function getCommonItems(items: string[]): string[] {
  if (!items.length) return [];

  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([item]) => item);
}