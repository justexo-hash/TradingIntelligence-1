import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import TradeForm from "@/components/forms/TradeForm";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";

export default function Trades() {
  const { data: trades } = useQuery({
    queryKey: ["/api/trades/1"], // TODO: Replace with actual user ID
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trade
            </Button>
          </DialogTrigger>
          <TradeForm />
        </Dialog>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {trades?.map((trade: any) => (
            <Card key={trade.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {trade.contractAddress}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {new Date(trade.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    P&L:{" "}
                    <span
                      className={
                        Number(trade.sellAmount) - Number(trade.buyAmount) > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      ${(Number(trade.sellAmount) - Number(trade.buyAmount)).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Setup</h4>
                  <div className="flex flex-wrap gap-2">
                    {trade.setup.map((s: string) => (
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
                    {trade.emotion.map((e: string) => (
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
                    {trade.mistakes.map((m: string) => (
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
