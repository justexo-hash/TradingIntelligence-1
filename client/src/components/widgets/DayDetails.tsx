import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trade } from "@shared/schema";
import { format } from "date-fns";

interface DayDetailsProps {
  date: Date;
  trades: Trade[];
  onClose: () => void;
}

const DayDetails = ({ date, trades, onClose }: DayDetailsProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const totalTrades = trades.length;
  const profitableTrades = trades.filter(
    (trade) => Number(trade.sellAmount) - Number(trade.buyAmount) > 0
  ).length;
  const totalPnL = trades.reduce(
    (sum, trade) => sum + (Number(trade.sellAmount) - Number(trade.buyAmount)),
    0
  );

  const getTokenDisplayName = (trade: Trade): string => {
    const name = trade.tokenName;
    const symbol = trade.tokenSymbol;

    if (name && symbol) {
      return `${name} (${symbol})`;
    }
    if (name) {
      return name;
    }
    if (symbol) {
      return symbol;
    }
    return trade.contractAddress;
  };

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/journals", {
        userId: 1,
        title: `Trading Notes - ${format(date, "MMM d, yyyy")}`,
        content: notes,
        folder: "daily",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals/1"] });
      toast({
        title: "Success",
        description: "Notes saved successfully.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] bg-clip-text text-transparent">
          {format(date, "MMMM d, yyyy")}
        </h3>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))]/0.1">
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold text-gradient">{totalTrades}</p>
        </div>
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))]/0.1">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold text-gradient">
            {totalTrades ? ((profitableTrades / totalTrades) * 100).toFixed(1) : "0"}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))]/0.1">
          <p className="text-sm text-muted-foreground">Net P&L</p>
          <p className="text-2xl font-bold text-gradient">{totalPnL.toFixed(4)} SOL</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Trade Details</h4>
        {trades.map((trade) => (
          <Card key={trade.id} className="p-4 bg-black/40">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {getTokenDisplayName(trade)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(trade.date).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">
                  P&L:{" "}
                  <span
                    className={
                      Number(trade.sellAmount) - Number(trade.buyAmount) > 0
                        ? "text-[rgb(var(--solana-green))]"
                        : "text-red-500"
                    }
                  >
                    {(Number(trade.sellAmount) - Number(trade.buyAmount)).toFixed(4)} SOL
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Setup</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.setup?.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-[rgb(var(--solana-green))]/0.1 rounded text-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Emotion</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.emotion?.map((e) => (
                    <span
                      key={e}
                      className="px-2 py-1 bg-[rgb(var(--solana-green))]/0.1 rounded text-sm"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Mistakes</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.mistakes?.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-1 bg-destructive/10 rounded text-sm"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {trade.notes && (
              <div className="mt-4 pt-4 border-t border-[rgb(var(--solana-green))]/10">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{trade.notes}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Daily Notes</h4>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your trading notes for the day..."
          className="min-h-[150px] bg-black/50"
        />
        <Button
          className="w-full bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
          onClick={() => saveNotesMutation.mutate()}
          disabled={!notes.trim() || saveNotesMutation.isPending}
        >
          Save Notes
        </Button>
      </div>
    </Card>
  );
};

export default DayDetails;