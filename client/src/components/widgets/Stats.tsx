import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target } from "lucide-react";
import type { Trade } from "@shared/schema";

interface StatsProps {
  trades: Trade[];
  accountBalance?: string;
}

export default function Stats({ trades = [], accountBalance = "0" }: StatsProps) {
  // Calculate stats
  let totalPnl = 0;
  let totalTrades = trades.length;
  let winningTrades = 0;

  trades.forEach((trade) => {
    const sellAmount = Number(trade.sellAmount || 0);
    const buyAmount = Number(trade.buyAmount || 0);
    const pnl = sellAmount - buyAmount;

    totalPnl += pnl;
    if (pnl > 0) winningTrades++;
  });

  const winRate = totalTrades > 0 
    ? ((winningTrades / totalTrades) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
      <Card className="p-4 border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg shadow-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--solana-green))] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        <div className="flex items-center">
          <div className="p-3 bg-[rgb(var(--solana-green))]/0.1 rounded-2xl shadow-inner">
            <DollarSign className="h-6 w-6 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account Balance
            </p>
            <h3 className="text-xl font-bold text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">
              {Number(accountBalance || 0).toFixed(4)} <span className="text-[#00ff99] opacity-90">SOL</span>
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg shadow-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--solana-green))] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        <div className="flex items-center">
          <div className="p-3 bg-[rgb(var(--solana-green))]/0.1 rounded-2xl shadow-inner">
            <TrendingUp className="h-6 w-6 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Net P&L
            </p>
            <h3 className="text-xl font-bold text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">
              {totalPnl.toFixed(4)} <span className="text-[#00ff99] opacity-90">SOL</span>
            </h3>
          </div>
        </div>
      </Card>

      <Card className="p-4 border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg shadow-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--solana-green))] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
        <div className="flex items-center">
          <div className="p-3 bg-[rgb(var(--solana-green))]/0.1 rounded-2xl shadow-inner">
            <Target className="h-6 w-6 text-[rgb(var(--solana-green))]" />
          </div>
          <div className="ml-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Win Rate
            </p>
            <h3 className="text-xl font-bold text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">
              {winRate}% <span className="text-[#00ff99] opacity-90">({winningTrades}/{totalTrades})</span>
            </h3>
          </div>
        </div>
      </Card>
    </div>
  );
}