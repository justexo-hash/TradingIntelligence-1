import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface ProfitChartProps {
  trades: any[];
}

export default function ProfitChart({ trades }: ProfitChartProps) {
  const data = trades?.reduce((acc: any[], trade: any) => {
    const date = new Date(trade.date).toLocaleDateString();
    const pnl = Number(trade.sellAmount) - Number(trade.buyAmount);
    const last = acc[acc.length - 1];
    
    return [
      ...acc,
      {
        date,
        balance: (last?.balance || 0) + pnl,
      },
    ];
  }, []);

  return (
    <div className="w-full h-[300px]">
      <h3 className="text-lg font-semibold mb-4">Profit/Loss Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <Card className="p-2">
                    <p className="text-sm">
                      Balance: Ꮏ{payload[0].value.toFixed(4)}
                    </p>
                  </Card>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}