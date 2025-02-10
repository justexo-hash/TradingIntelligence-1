import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { insertTradeSchema, type InsertTrade } from "@shared/schema";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const setupOptions = ["Volume", "Socials", "Shilled in groups", "Art"];
const emotionOptions = [
  "Anxious",
  "Excited",
  "Fearful",
  "Bullish",
  "Bearish",
  "Relaxed",
  "Indifferent",
];
const mistakeOptions = [
  "No mistakes",
  "Bought too much",
  "Bought too little",
  "Sold too early",
  "Sold too late",
  "Setup Oversight",
  "Distracted",
  "Too little volume",
  "Other",
];

export default function TradeForm() {
  const { toast } = useToast();
  const [buys, setBuys] = useState([{ amount: "" }]);
  const [sells, setSells] = useState([{ amount: "" }]);

  const form = useForm<InsertTrade>({
    resolver: zodResolver(insertTradeSchema),
    defaultValues: {
      userId: 1, // TODO: Replace with actual user ID
      contractAddress: "",
      buyAmount: "0",
      sellAmount: "0",
      setup: [],
      emotion: [],
      mistakes: [],
      notes: "",
    },
  });

  const tradeMutation = useMutation({
    mutationFn: async (data: InsertTrade) => {
      return apiRequest("POST", "/api/trades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades/1"] });
      toast({
        title: "Success",
        description: "Trade saved successfully.",
      });
      form.reset();
      // Find and click the DialogClose button
      const closeButton = document.querySelector('[data-button="close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrade) => {
    const totalBuyAmount = buys
      .reduce((sum, buy) => sum + (Number(buy.amount) || 0), 0)
      .toString();
    const totalSellAmount = sells
      .reduce((sum, sell) => sum + (Number(sell.amount) || 0), 0)
      .toString();

    tradeMutation.mutate({
      ...data,
      buyAmount: totalBuyAmount,
      sellAmount: totalSellAmount,
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>New Trade</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="contractAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Address</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormLabel>Buy Amount(s)</FormLabel>
            {buys.map((buy, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="number"
                  value={buy.amount}
                  onChange={(e) => {
                    const newBuys = [...buys];
                    newBuys[i].amount = e.target.value;
                    setBuys(newBuys);
                  }}
                  placeholder="Amount"
                />
                {buys.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setBuys(buys.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setBuys([...buys, { amount: "" }])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Buy
            </Button>
          </div>

          <div className="space-y-4">
            <FormLabel>Sell Amount(s)</FormLabel>
            {sells.map((sell, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="number"
                  value={sell.amount}
                  onChange={(e) => {
                    const newSells = [...sells];
                    newSells[i].amount = e.target.value;
                    setSells(newSells);
                  }}
                  placeholder="Amount"
                />
                {sells.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSells(sells.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSells([...sells, { amount: "" }])}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sell
            </Button>
          </div>

          <FormField
            control={form.control}
            name="setup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setup</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {setupOptions.map((option) => (
                    <FormItem
                      key={option}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        checked={field.value?.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value ?? []), option]
                            : (field.value ?? []).filter((v) => v !== option);
                          field.onChange(newValue);
                        }}
                      />
                      <FormLabel className="font-normal">{option}</FormLabel>
                    </FormItem>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emotion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emotion</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {emotionOptions.map((option) => (
                    <FormItem
                      key={option}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        checked={field.value?.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value ?? []), option]
                            : (field.value ?? []).filter((v) => v !== option);
                          field.onChange(newValue);
                        }}
                      />
                      <FormLabel className="font-normal">{option}</FormLabel>
                    </FormItem>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mistakes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mistakes</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {mistakeOptions.map((option) => (
                    <FormItem
                      key={option}
                      className="flex items-center space-x-3"
                    >
                      <Checkbox
                        checked={field.value?.includes(option)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value ?? []), option]
                            : (field.value ?? []).filter((v) => v !== option);
                          field.onChange(newValue);
                        }}
                      />
                      <FormLabel className="font-normal">{option}</FormLabel>
                    </FormItem>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" data-button="close">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={tradeMutation.isPending}>
              {tradeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Trade
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
