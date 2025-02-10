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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      <Card className="p-4 md:p-6 card-gradient">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3 md:ml-4">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Account Balance
            </p>
            <h3 className="text-lg md:text-2xl font-bold text-gradient">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 card-gradient">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3 md:ml-4">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Net P&L
            </p>
            <h3 className="text-lg md:text-2xl font-bold text-gradient">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6 card-gradient sm:col-span-2 lg:col-span-1">
        <div className="flex items-center">
          <div className="p-2 bg-[rgb(var(--solana-green))/0.1] rounded">
            <Target className="h-4 w-4 md:h-5 md:w-5 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-3 md:ml-4">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">
              Win Rate
            </p>
            <h3 className="text-lg md:text-2xl font-bold text-gradient">
              {winRate}% ({stats.winningTrades}/{stats.totalTrades})
            </h3>
          </div>
        </div>
      </Card>
    </div>
  );
}