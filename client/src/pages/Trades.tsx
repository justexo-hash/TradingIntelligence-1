import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
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
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trade } from "@shared/schema";

export default function Trades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const { data: trades } = useQuery<Trade[]>({
    queryKey: [`/api/trades/${user?.id}`],
    enabled: !!user,
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      return apiRequest("DELETE", `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${user?.id}`] });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades</h1>
        <Dialog onOpenChange={(open) => !open && setEditingTrade(null)}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trade
            </Button>
          </DialogTrigger>
          <TradeForm editingTrade={null} />
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {trades?.map((trade) => (
            <Card key={trade.id} className="p-6">
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