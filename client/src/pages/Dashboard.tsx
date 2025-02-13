import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Stats from "@/components/widgets/Stats";
import TradeCalendar from "@/components/widgets/TradeCalendar";
import LineChart from "@/components/widgets/LineChart";
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trade } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import DayDetails from "@/components/widgets/DayDetails";
import BalanceForm from "@/components/forms/BalanceForm";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState<"pnl" | "winrate">("pnl");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const { user } = useAuth();

  const { data: trades = [] } = useQuery<Trade[]>({
    queryKey: [`/api/trades/${user?.id}`],
    enabled: !!user,
  });

  // Show balance dialog only for new users with 0 balance
  useEffect(() => {
    if (user && Number(user.accountBalance || "0") === 0 && !showBalanceDialog) {
      setShowBalanceDialog(true);
    }
  }, [user]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-gradient-to-b from-black via-black/95 to-black/90 pb-20">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold md:text-4xl text-[#39FF14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
              Dashboard
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-muted-foreground">
                Your trading performance at a glance
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    Update Balance
                  </Button>
                </DialogTrigger>
                <BalanceForm currentBalance={user?.accountBalance || "0"} />
              </Dialog>
            </div>
          </div>

          <Select value={filter} onValueChange={(v: "pnl" | "winrate") => setFilter(v)}>
            <SelectTrigger className="h-9 w-[180px] border-none bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pnl">P&L</SelectItem>
              <SelectItem value="winrate">Win Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Stats trades={trades} accountBalance={user?.accountBalance || "0"} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="flex-1 overflow-hidden border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg p-6 shadow-lg">
            <TradeCalendar
              trades={trades}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              filter={filter}
              onDaySelect={(date, trades) => {
                setSelectedDate(date);
                setSelectedDayTrades(trades);
              }}
            />
          </Card>

          <LineChart 
            trades={trades}
            accountBalance={user?.accountBalance || "0"}
          />
        </div>

        {selectedDate && selectedDayTrades.length > 0 && (
          <div className="mt-6 lg:col-span-2">
            <DayDetails
              date={selectedDate}
              trades={selectedDayTrades}
              onClose={() => {
                setSelectedDate(null);
                setSelectedDayTrades([]);
              }}
            />
          </div>
        )}

        {/* Balance dialog for new users */}
        <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
          <BalanceForm 
            isNewUser 
            onClose={() => setShowBalanceDialog(false)} 
            currentBalance={user?.accountBalance || "0"}
          />
        </Dialog>
      </div>
    </div>
  );
}