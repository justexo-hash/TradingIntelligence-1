import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import TradeForm from "@/components/forms/TradeForm";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Trash2, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trade } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type SortOption = "name" | "date" | "pnl" | "buyAmount";

const shareTradeSchema = z.object({
  analysis: z.string().min(1, "Analysis is required").max(1000, "Analysis must be less than 1000 characters"),
});

type ShareTradeForm = z.infer<typeof shareTradeSchema>;

export default function Trades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [sharingTrade, setSharingTrade] = useState<Trade | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const shareForm = useForm<ShareTradeForm>({
    resolver: zodResolver(shareTradeSchema),
    defaultValues: {
      analysis: "",
    },
  });

  const { data: trades, refetch: refetchTrades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
    enabled: !!user,
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      return apiRequest("DELETE", `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Also refresh user data for balance
      toast({
        title: "Success",
        description: "Trade deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const shareTradeMutation = useMutation({
    mutationFn: async ({ tradeId, analysis }: { tradeId: number; analysis: string }) => {
      return apiRequest("POST", "/api/shared-trades", { tradeId, analysis });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user data for experience
      toast({
        title: "Success",
        description: "Trade shared successfully. You earned 10 experience points!",
      });
      setSharingTrade(null);
      shareForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sortedTrades = [...(trades || [])].sort((a, b) => {
    switch (sortBy) {
      case "name":
        const aName = a.tokenName || a.contractAddress;
        const bName = b.tokenName || b.contractAddress;
        return aName.localeCompare(bName);
      case "date":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "pnl":
        const aPnL = Number(a.sellAmount) - Number(a.buyAmount);
        const bPnL = Number(b.sellAmount) - Number(b.buyAmount);
        return bPnL - aPnL;
      case "buyAmount":
        return Number(b.buyAmount) - Number(a.buyAmount);
      default:
        return 0;
    }
  });

  const onShareSubmit = (data: ShareTradeForm) => {
    if (!sharingTrade) return;
    shareTradeMutation.mutate({ tradeId: sharingTrade.id, analysis: data.analysis });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold md:text-4xl text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">Trades</h1>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px] bg-black/60 backdrop-blur-sm border-none">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="pnl">P&L</SelectItem>
              <SelectItem value="buyAmount">Buy Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog onOpenChange={(open) => !open && setEditingTrade(null)}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trade
            </Button>
          </DialogTrigger>
          <TradeForm editingTrade={null} />
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="grid gap-4">
          {sortedTrades?.map((trade) => (
            <Card key={trade.id} className="p-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {trade.tokenName ? (
                      <>
                        {trade.tokenName} {trade.tokenSymbol && `(${trade.tokenSymbol})`}
                      </>
                    ) : (
                      trade.contractAddress
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {new Date(trade.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-start gap-4">
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
                  <div className="flex gap-2">
                    <Dialog onOpenChange={(open) => !open && setEditingTrade(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTrade(trade)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      {editingTrade?.id === trade.id && <TradeForm editingTrade={trade} />}
                    </Dialog>

                    {!trade.isShared && (
                      <Dialog open={sharingTrade?.id === trade.id} onOpenChange={(open) => !open && setSharingTrade(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSharingTrade(trade)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Share Trade</DialogTitle>
                            <DialogDescription>
                              Share your trade with the community. Add your analysis to help others learn from your experience.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...shareForm}>
                            <form onSubmit={shareForm.handleSubmit(onShareSubmit)}>
                              <FormField
                                control={shareForm.control}
                                name="analysis"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Analysis</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Share your thoughts on this trade..."
                                        className="min-h-[100px]"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <DialogFooter className="mt-4">
                                <Button type="submit" disabled={shareTradeMutation.isPending}>
                                  Share Trade
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this trade? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTradeMutation.mutate(trade.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
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
                <div>
                  <h4 className="font-medium mb-2">Emotion</h4>
                  <div className="flex flex-wrap gap-2">
                    {trade.emotion?.map((e) => (
                      <span
                        key={e}
                        className="px-2 py-1 bg-primary/10 rounded text-sm"
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
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{trade.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}