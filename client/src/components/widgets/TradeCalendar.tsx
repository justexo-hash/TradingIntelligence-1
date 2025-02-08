import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Trade } from "@shared/schema";
import { type DayContentProps } from "react-day-picker";

interface TradeCalendarProps {
  trades: Trade[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  filter: "pnl" | "winrate";
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
}: TradeCalendarProps) {
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
    if (!dayTrades) return <div>{date.getDate()}</div>;

    const winRate = dayTrades.trades.length
      ? (dayTrades.wins / dayTrades.trades.length) * 100
      : 0;

    return (
      <div
        className={cn(
          "w-full h-full p-2",
          filter === "pnl"
            ? dayTrades.pnl > 0
              ? "bg-green-100 dark:bg-green-900/20"
              : "bg-red-100 dark:bg-red-900/20"
            : winRate >= 50
            ? "bg-green-100 dark:bg-green-900/20"
            : "bg-red-100 dark:bg-red-900/20"
        )}
      >
        <div className="font-normal">{date.getDate()}</div>
        <div className="text-xs mt-1">
          {filter === "pnl"
            ? `${dayTrades.pnl.toFixed(4)} SOL`
            : `${winRate.toFixed(0)}%`}
        </div>
        <div className="text-xs">{dayTrades.trades.length} trades</div>
      </div>
    );
  };

  return (
    <Calendar
      mode="single"
      selected={selectedMonth}
      onSelect={(date) => date && onMonthChange(date)}
      className="rounded-md border"
      modifiers={{
        trading: (date) =>
          Boolean(tradesByDate?.[date.toDateString()]?.trades.length),
      }}
      modifiersStyles={{
        trading: {
          fontWeight: "bold",
        },
      }}
      components={{
        DayContent,
      }}
    />
  );
}