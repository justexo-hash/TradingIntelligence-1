import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Trade } from "@shared/schema";
import { type DayContentProps } from "react-day-picker";

interface TradeCalendarProps {
  trades: Trade[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  filter: "pnl" | "winrate";
  onDaySelect: (date: Date, trades: Trade[]) => void;
}

interface TradeDay {
  trades: Trade[];
  pnl: number;
  wins: number;
}

export default function TradeCalendar({
  trades,
  selectedMonth,
  onMonthChange,
  filter,
  onDaySelect,
}: TradeCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const tradesByDate = trades?.reduce((acc: Record<string, TradeDay>, trade: Trade) => {
    const date = new Date(trade.date).toDateString();
    if (!acc[date]) {
      acc[date] = {
        trades: [],
        pnl: 0,
        wins: 0,
      };
    }
    acc[date].trades.push(trade);
    const pnl = Number(trade.sellAmount ?? 0) - Number(trade.buyAmount);
    acc[date].pnl += pnl;
    if (pnl > 0) acc[date].wins++;
    return acc;
  }, {});

  const DayContent = ({ date }: DayContentProps) => {
    const dayTrades = tradesByDate?.[date.toDateString()];
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    if (!dayTrades) return <div>{date.getDate()}</div>;

    const winRate = dayTrades.trades.length
      ? (dayTrades.wins / dayTrades.trades.length) * 100
      : 0;

    return (
      <div
        className={cn(
          "w-full h-full p-2 ring-1 ring-inset transition-colors",
          dayTrades.trades.length > 0 && "ring-white/20 bg-white/5",
          isSelected && "ring-[rgb(var(--solana-green))] bg-[rgb(var(--solana-green))]/20",
          !isSelected && filter === "pnl" && dayTrades.pnl > 0 && "bg-[rgb(var(--solana-green))]/10",
          !isSelected && filter === "pnl" && dayTrades.pnl <= 0 && "bg-red-900/20",
          !isSelected && filter === "winrate" && winRate >= 50 && "bg-[rgb(var(--solana-green))]/10",
          !isSelected && filter === "winrate" && winRate < 50 && "bg-red-900/20"
        )}
      >
        <div className="font-normal">{date.getDate()}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Calendar
        mode="single"
        selected={selectedMonth}
        onSelect={(date) => {
          if (date) {
            const hasTradesForDay = tradesByDate?.[date.toDateString()]?.trades.length > 0;
            if (hasTradesForDay) {
              setSelectedDate(date);
              onDaySelect(date, tradesByDate[date.toDateString()].trades);
            } else {
              onMonthChange(date);
            }
          }
        }}
        className="rounded-md border"
        modifiers={{
          trading: (date) =>
            Boolean(tradesByDate?.[date.toDateString()]?.trades.length),
        }}
        modifiersStyles={{
          trading: {
            fontWeight: "bold",
            cursor: "pointer",
          },
        }}
        components={{
          DayContent,
        }}
      />
    </div>
  );
}