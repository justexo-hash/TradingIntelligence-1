import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target } from "lucide-react";

interface StatsProps {
  trades: any[];
}

export default function Stats({ trades }: StatsProps) {
  const stats = trades?.reduce(
    (acc, trade) => {
      const pnl = Number(trade.sellAmount) - Number(trade.buyAmount);
      return {
        balance: acc.balance + pnl,
        totalTrades: acc.totalTrades + 1,
        winningTrades:
          acc.winningTrades + (pnl > 0 ? 1 : 0),
      };
    },
    { balance: 0, totalTrades: 0, winningTrades: 0 }
  ) ?? { balance: 0, totalTrades: 0, winningTrades: 0 };

  const winRate = stats.totalTrades
    ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
      <Card className="p-4 border-[rgb(var(--solana-green))/0.2] bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-colors">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded-xl">
            <DollarSign className="h-5 w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-muted-foreground">
              Account Balance
            </p>
            <h3 className="text-lg font-bold bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] bg-clip-text text-transparent">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-[rgb(var(--solana-green))/0.2] bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-colors">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded-xl">
            <TrendingUp className="h-5 w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-muted-foreground">
              Net P&L
            </p>
            <h3 className="text-lg font-bold bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] bg-clip-text text-transparent">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-[rgb(var(--solana-green))/0.2] bg-black/60 backdrop-blur-sm hover:bg-black/70 transition-colors">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded-xl">
            <Target className="h-5 w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-muted-foreground">
              Win Rate
            </p>
            <h3 className="text-lg font-bold bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] bg-clip-text text-transparent">
              {winRate}% ({stats.winningTrades}/{stats.totalTrades})
            </h3>
          </div>
        </div>
      </Card>
    </div>
  );
}