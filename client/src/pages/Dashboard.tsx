import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Stats from "@/components/widgets/Stats";
import TradeCalendar from "@/components/widgets/TradeCalendar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trade } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState<"pnl" | "winrate">("pnl");
  const { user } = useAuth();

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades", user?.id],
    enabled: !!user,
  });

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-gradient-to-b from-black via-black/95 to-black/90 pb-20 md:min-h-screen">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative flex flex-col gap-6 p-4 md:gap-8 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-4xl bg-gradient-to-r from-[rgb(var(--solana-green))] via-[rgb(var(--solana-purple))] to-[rgb(var(--solana-green))] bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your trading performance at a glance
            </p>
          </div>

          <Select value={filter} onValueChange={(v: "pnl" | "winrate") => setFilter(v)}>
            <SelectTrigger className="h-9 w-full max-w-[180px] border-none bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pnl">P&L</SelectItem>
              <SelectItem value="winrate">Win Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Stats trades={trades || []} />

        <Card className="flex-1 overflow-hidden border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg p-6 shadow-lg">
          <TradeCalendar
            trades={trades || []}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            filter={filter}
          />
        </Card>
      </div>
    </div>
  );
}