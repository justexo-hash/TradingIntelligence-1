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
      <Card className="p-3 card-gradient">
        <div className="flex items-center">
          <div className="p-1.5 bg-[rgb(var(--solana-green))/0.1] rounded">
            <DollarSign className="h-4 w-4 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Account Balance
            </p>
            <h3 className="text-base font-bold text-gradient">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-3 card-gradient">
        <div className="flex items-center">
          <div className="p-1.5 bg-[rgb(var(--solana-green))/0.1] rounded">
            <TrendingUp className="h-4 w-4 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Net P&L
            </p>
            <h3 className="text-base font-bold text-gradient">
              {stats.balance.toFixed(4)} SOL
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-3 card-gradient">
        <div className="flex items-center">
          <div className="p-1.5 bg-[rgb(var(--solana-green))/0.1] rounded">
            <Target className="h-4 w-4 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-2.5">
            <p className="text-xs font-medium text-muted-foreground">
              Win Rate
            </p>
            <h3 className="text-base font-bold text-gradient">
              {winRate}% ({stats.winningTrades}/{stats.totalTrades})
            </h3>
          </div>
        </div>
      </Card>
    </div>
  );
}