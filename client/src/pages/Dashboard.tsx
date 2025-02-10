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
    queryKey: ["/api/trades/1"], // TODO: Replace with actual user ID
  });

  return (
    <div className="flex flex-col gap-3 p-3 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold md:text-3xl">Dashboard</h1>
        <Select value={filter} onValueChange={(v: "pnl" | "winrate") => setFilter(v)}>
          <SelectTrigger className="h-9 w-full md:w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pnl">P&L</SelectItem>
            <SelectItem value="winrate">Win Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <Stats trades={trades || []} />
      </div>

      <Card className="overflow-hidden p-3 md:p-6">
        <TradeCalendar
          trades={trades || []}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          filter={filter}
        />
      </Card>
    </div>
  );
}