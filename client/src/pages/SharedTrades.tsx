import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, MessageSquare } from "lucide-react";
import type { SharedTrade } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function SharedTrades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [selectedTrade, setSelectedTrade] = useState<SharedTrade | null>(null);

  const { data: sharedTrades } = useQuery<SharedTrade[]>({
    queryKey: ["/api/shared-trades"],
  });

  const likeTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      return apiRequest("POST", `/api/shared-trades/${tradeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-trades"] });
      toast({
        title: "Success",
        description: "Trade liked!",
      });
    },
  });

  const commentTradeMutation = useMutation({
    mutationFn: async ({ tradeId, content }: { tradeId: number; content: string }) => {
      return apiRequest("POST", `/api/shared-trades/${tradeId}/comment`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shared-trades"] });
      toast({
        title: "Success",
        description: "Comment added! You earned 2 experience points!",
      });
      setComment("");
      setSelectedTrade(null);
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Trades</h1>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="grid gap-4">
          {sharedTrades?.map((trade) => (
            <Card key={trade.id} className="p-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {trade.tokenName} {trade.tokenSymbol && `(${trade.tokenSymbol})`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trade.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    P&L:{" "}
                    <span
                      className={
                        Number(trade.outcome) > 0
                          ? "text-[rgb(var(--solana-green))]"
                          : "text-red-500"
                      }
                    >
                      {Number(trade.outcome).toFixed(4)} SOL
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Setup</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.setup?.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 bg-primary/10 rounded text-sm"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {trade.analysis}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => likeTradeMutation.mutate(trade.id)}
                  disabled={likeTradeMutation.isPending}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {trade.likes || 0}
                </Button>

                <Dialog
                  open={selectedTrade?.id === trade.id}
                  onOpenChange={(open) => !open && setSelectedTrade(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {(trade.comments as any[])?.length || 0}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Comments</DialogTitle>
                      <DialogDescription>
                        Join the discussion about this trade.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] px-4">
                      {(trade.comments as any[])?.map((comment, i) => (
                        <div key={i} className="py-4 border-b last:border-0">
                          <p className="text-sm text-muted-foreground">
                            User #{comment.userId}
                          </p>
                          <p className="mt-1">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <Button
                        onClick={() =>
                          commentTradeMutation.mutate({
                            tradeId: trade.id,
                            content: comment,
                          })
                        }
                        disabled={!comment.trim() || commentTradeMutation.isPending}
                      >
                        Comment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
