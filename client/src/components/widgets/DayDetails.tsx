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

export default function DayDetails({ date, trades, onClose }: DayDetailsProps) {
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

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/journals", {
        userId: 1, // TODO: Replace with actual user ID
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
    <Card className="p-6 card-gradient space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gradient">
          {format(date, "MMMM d, yyyy")}
        </h3>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))/0.1]">
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold text-gradient">{totalTrades}</p>
        </div>
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))/0.1]">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold text-gradient">
            {totalTrades ? ((profitableTrades / totalTrades) * 100).toFixed(1) : "0"}%
          </p>
        </div>
        <div className="p-4 rounded-lg bg-[rgb(var(--solana-green))/0.1]">
          <p className="text-sm text-muted-foreground">Net P&L</p>
          <p className="text-2xl font-bold text-gradient">{totalPnL.toFixed(4)} SOL</p>
        </div>
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
          className="w-full button-gradient"
          onClick={() => saveNotesMutation.mutate()}
          disabled={!notes.trim() || saveNotesMutation.isPending}
        >
          Save Notes
        </Button>
      </div>
    </Card>
  );
}
