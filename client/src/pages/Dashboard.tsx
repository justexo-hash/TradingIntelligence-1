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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Select value={filter} onValueChange={(v: "pnl" | "winrate") => setFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pnl">P&L</SelectItem>
              <SelectItem value="winrate">Win Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Stats trades={trades || []} />

      <Card className="p-6">
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