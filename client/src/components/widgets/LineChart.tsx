import { useState, useMemo } from "react";
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trade } from "@shared/schema";
import { format } from "date-fns";

type MetricType = "balance" | "pnl" | "winrate";

interface LineChartProps {
  trades: Trade[];
  accountBalance: string;
}

export default function LineChart({ trades, accountBalance }: LineChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("balance");

  const chartData = useMemo(() => {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = Number(accountBalance);
    let runningWins = 0;
    let totalTrades = 0;

    return sortedTrades.map(trade => {
      const date = new Date(trade.date);
      const pnl = Number(trade.sellAmount || 0) - Number(trade.buyAmount);
      runningBalance += pnl;
      totalTrades++;
      if (pnl > 0) runningWins++;

      return {
        date: format(date, "MMM d"),
        balance: runningBalance,
        pnl,
        winrate: (runningWins / totalTrades) * 100
      };
    });
  }, [trades, accountBalance]);

  const getYAxisLabel = () => {
    switch (selectedMetric) {
      case "balance":
        return "Account Balance (SOL)";
      case "pnl":
        return "Net P&L (SOL)";
      case "winrate":
        return "Win Rate (%)";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Performance Chart</h3>
        <Select value={selectedMetric} onValueChange={(v: MetricType) => setSelectedMetric(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Account Balance</SelectItem>
            <SelectItem value="pnl">Net P&L</SelectItem>
            <SelectItem value="winrate">Win Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              label={{ 
                value: getYAxisLabel(),
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="rgb(var(--solana-green))"
              strokeWidth={2}
              dot={false}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}