import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertTradeSchema,
  upsertTokenSummarySchema,
  type InsertTrade,
  type Trade,
  type UpsertTokenSummary,
  type TokenSummary,
} from "@shared/schema";

interface TokenInfo {
  name?: string; 
  symbol?: string;
  image?: string;
  description?: string;
  usdMarketCap?: string;
  price?: string;
  volume24h?: string;
}
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker";
import { useDebouncedCallback } from "use-debounce";

const setupOptions = [
  "Fast Volume",
  "Good Socials",
  "Shared in groups",
  "Good Art",
  "Narrative / Meta",
  "Derivative / Correlation of another asset",
  "Decent MC Entry",
  "Technical Analysis Indication",
  "Wallet Tracking",
  "Other",
];
const emotionOptions = [
  "Anxious",
  "Excited",
  "Fearful",
  "Bullish",
  "Bearish",
  "Relaxed",
  "Indifferent",
  "Bored",
  "Annoyed",
  "Sad",
  "Other",
];
const mistakeOptions = [
  "No Mistakes",
  "Overbought",
  "Underbought",
  "Oversold",
  "Undersold",
  "Setup Oversight",
  "Distracted",
  "Too little volume",
  "Trying to be too perfect",
  "Other",
];

interface TradeFormProps {
  editingTrade: Partial<Trade> | null;
  isSummaryEdit?: boolean;
}

const getSafeFormValue = <T extends keyof InsertTrade>(form: ReturnType<typeof useForm<InsertTrade>>, key: T): InsertTrade[T] => {
  const value = form.getValues(key);
  if (Array.isArray(value)) return value as InsertTrade[T];
  if (typeof value === 'string') return value as InsertTrade[T];
  if (value === null || value === undefined) {
      if (key === 'setup' || key === 'emotion' || key === 'mistakes') return [] as InsertTrade[T];
      if (key === 'notes') return '' as InsertTrade[T];
  }
  return value;
};

export default function TradeForm({ editingTrade, isSummaryEdit = false }: TradeFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [buys, setBuys] = useState(() => [{ amount: editingTrade?.buyAmount || "" }]);
  const [sells, setSells] = useState(() => [{ amount: editingTrade?.sellAmount || "" }]);
  const [contractAddress, setContractAddress] = useState(editingTrade?.contractAddress || "");
  const [customSetup, setCustomSetup] = useState("");
  const [customEmotion, setCustomEmotion] = useState("");
  const [customMistake, setCustomMistake] = useState("");

  const debouncedLookup = useDebouncedCallback((address: string) => {
    if (address && !isSummaryEdit) {
      setContractAddress(address);
    }
  }, 500);

  const {
    data: tokenInfo,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useQuery<TokenInfo>({
    queryKey: [`/api/token/${contractAddress}`],
    enabled: !!contractAddress && contractAddress.length > 30 && !isSummaryEdit,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingSummaryData, isLoading: isLoadingSummary } = useQuery<TokenSummary>({
    queryKey: [`/api/trades/summary/${editingTrade?.contractAddress}`],
    enabled: isSummaryEdit && !!editingTrade?.contractAddress && !!user?.id,
    retry: 1,
  });

  const form = useForm<InsertTrade>({
    resolver: zodResolver(insertTradeSchema),
    defaultValues: {
      userId: user?.id || 0,
      contractAddress: editingTrade?.contractAddress || "",
      buyAmount: editingTrade?.buyAmount || "0",
      sellAmount: editingTrade?.sellAmount || "0",
      setup: editingTrade?.setup || [],
      emotion: editingTrade?.emotion || [],
      mistakes: editingTrade?.mistakes || [],
      notes: editingTrade?.notes || "",
      date: editingTrade?.date ? new Date(editingTrade.date) : new Date(),
      tokenName: null,
      tokenSymbol: null,
      tokenImage: null,
    },
  });

  useEffect(() => {
    const isEditing = !!editingTrade;
    const contract = editingTrade?.contractAddress || "";
    setContractAddress(contract);

    const baseValues: Partial<InsertTrade> = {
      userId: user?.id || 0,
      contractAddress: contract,
      buyAmount: editingTrade?.buyAmount || "0",
      sellAmount: editingTrade?.sellAmount || "0",
      tokenAmount: editingTrade?.tokenAmount || "0",
      date: editingTrade?.date ? new Date(editingTrade.date) : new Date(),
      setup: editingTrade?.setup || [],
      emotion: editingTrade?.emotion || [],
      mistakes: editingTrade?.mistakes || [],
      notes: editingTrade?.notes || "",
      tokenName: editingTrade?.tokenName || null,
      tokenSymbol: editingTrade?.tokenSymbol || null,
      tokenImage: editingTrade?.tokenImage || null,
      source: editingTrade?.source || (isSummaryEdit ? 'summary' : 'manual'),
      transactionSignature: editingTrade?.transactionSignature ?? undefined,
      isShared: editingTrade?.isShared ?? false,
    };

    if (isSummaryEdit && existingSummaryData) {
      baseValues.notes = existingSummaryData.notes || baseValues.notes;
      baseValues.setup = existingSummaryData.setup || baseValues.setup;
      baseValues.emotion = existingSummaryData.emotion || baseValues.emotion;
      baseValues.mistakes = existingSummaryData.mistakes || baseValues.mistakes;
    }

    form.reset(baseValues as InsertTrade);

    setBuys([{ amount: baseValues.buyAmount || "" }]);
    setSells([{ amount: baseValues.sellAmount || "" }]);
    const currentSetup = baseValues.setup || [];
    const currentEmotion = baseValues.emotion || [];
    const currentMistakes = baseValues.mistakes || [];
    setCustomSetup(currentSetup.includes("Other") ? (currentSetup.find(s => !setupOptions.includes(s)) || "") : "");
    setCustomEmotion(currentEmotion.includes("Other") ? (currentEmotion.find(e => !emotionOptions.includes(e)) || "") : "");
    setCustomMistake(currentMistakes.includes("Other") ? (currentMistakes.find(m => !mistakeOptions.includes(m)) || "") : "");

  }, [editingTrade, isSummaryEdit, existingSummaryData, form, user?.id]);

  const createTradeMutation = useMutation({
    mutationFn: async (data: InsertTrade) => {
      const response = await apiRequest("POST", "/api/trades", data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Trade saved successfully.",
      });
      form.reset();
      const closeButton = document.querySelector('[data-button="close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    },
    onError: (error: Error) => {
      console.error("Trade creation error:", error);
      toast({
        title: "Error",
        description: "Failed to save trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTradeMutation = useMutation({
    mutationFn: async (data: InsertTrade & { id: number }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/trades/${data.id}`,
        data,
      );
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Trade updated successfully.",
      });
      form.reset();
      const closeButton = document.querySelector('[data-button="close"]');
      if (closeButton instanceof HTMLElement) {
        closeButton.click();
      }
    },
    onError: (error: Error) => {
      console.error("Trade update error:", error);
      toast({
        title: "Error",
        description: "Failed to update trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const upsertSummaryMutation = useMutation({ 
    mutationFn: async (data: UpsertTokenSummary) => {
      if (!data.contractAddress) throw new Error("Contract address required");
      const response = await apiRequest("PATCH", `/api/trades/summary/${data.contractAddress}`, data);
      const result = await response.json();
      return { ...result, inputData: data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades/grouped'] });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({ title: "Success", description: `Summary updated.` });
      const closeButton = document.querySelector('[data-button="close"]');
      if (closeButton instanceof HTMLElement) closeButton.click();
    },
    onError: (error: any) => {
      console.error("Failed to update summary:", error);
      toast({
        title: "Error",
        description: "Failed to update summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrade) => {
    const combineOptions = (options: string[] | undefined | null, customValue: string, otherValue: string): string[] => {
      const baseOptions = (options || []).filter(o => o !== otherValue);
      if ((options || []).includes(otherValue) && customValue.trim()) {
        return [...baseOptions, customValue.trim()];
      }
      return baseOptions;
    };
    const finalSetup = combineOptions(getSafeFormValue(form, 'setup'), customSetup, "Other");
    const finalEmotion = combineOptions(getSafeFormValue(form, 'emotion'), customEmotion, "Other");
    const finalMistakes = combineOptions(getSafeFormValue(form, 'mistakes'), customMistake, "Other");
    const finalNotes = getSafeFormValue(form, 'notes');

    if (isSummaryEdit) {
      if (!editingTrade?.contractAddress) {
        toast({
          title: "Error",
          description: "Contract address is required for summary edit.",
          variant: "destructive",
        });
        return;
      }
      const summaryData: UpsertTokenSummary = {
        userId: user!.id,
        contractAddress: editingTrade.contractAddress,
        notes: finalNotes,
        setup: finalSetup,
        emotion: finalEmotion,
        mistakes: finalMistakes,
      };
      console.log("Upserting summary data:", summaryData);
      upsertSummaryMutation.mutate(summaryData);
    } else {
      const totalBuyAmount = buys.reduce((sum, buy) => sum + (Number(buy.amount) || 0), 0).toString();
      const totalSellAmount = sells.reduce((sum, sell) => sum + (Number(sell.amount) || 0), 0).toString();
      const tokenAmount = form.getValues('tokenAmount') || "0";

      const tradeData: InsertTrade = {
        userId: user!.id, 
        contractAddress: data.contractAddress,
        date: data.date instanceof Date ? data.date : new Date(data.date || Date.now()),
        buyAmount: totalBuyAmount,
        sellAmount: totalSellAmount,
        tokenAmount: tokenAmount,
        setup: finalSetup,
        emotion: finalEmotion,
        mistakes: finalMistakes,
        notes: finalNotes,
        tokenName: tokenInfo?.name || data.tokenName || null,
        tokenSymbol: tokenInfo?.symbol || data.tokenSymbol || null,
        tokenImage: tokenInfo?.image || data.tokenImage || null,
      };
      console.log("Submitting trade data:", tradeData);
      if (editingTrade?.id) { 
        updateTradeMutation.mutate({ ...tradeData, id: editingTrade.id });
      } else {
        createTradeMutation.mutate(tradeData);
      }
    }
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
      <DialogHeader>
        <DialogTitle>{isSummaryEdit ? `Edit Summary: ${editingTrade?.tokenName || editingTrade?.contractAddress}` : (editingTrade ? "Edit Trade" : "New Trade")}</DialogTitle>
      </DialogHeader>

      {(isLoadingSummary && isSummaryEdit) ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-16">
            <FormField
              control={form.control}
              name="contractAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Address</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          if (e.target.value.length > 0) {
                            debouncedLookup(e.target.value);
                          }
                        }}
                        placeholder="Enter contract address"
                        disabled={isSummaryEdit || !!editingTrade}
                      />
                      <FormDescription className="space-y-2 text-sm">
                        {tokenInfo && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div>
                                {tokenInfo.name && (
                                  <p className="font-medium">
                                    {tokenInfo.name}{" "}
                                    {tokenInfo.symbol && `(${tokenInfo.symbol})`}
                                  </p>
                                )}
                                {tokenInfo.description && (
                                  <p className="text-muted-foreground text-xs">
                                    {tokenInfo.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            {tokenInfo.usdMarketCap && (
                              <p className="text-xs">
                                Market Cap:{" "}
                                {tokenInfo.usdMarketCap}
                              </p>
                            )}
                          </div>
                        )}
                      </FormDescription>
                      {isLoadingToken && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Looking up token...
                        </div>
                      )}
                      {tokenError && (
                        <div className="flex items-center text-sm text-destructive">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          {tokenError instanceof Error
                            ? tokenError.message
                            : "Could not fetch token information. Please verify the contract address."}
                          {tokenError instanceof Error &&
                            tokenError.message.includes("Rate limit") && (
                              <p className="text-xs mt-1">
                                Please wait a moment before trying again.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className={isSummaryEdit ? 'opacity-50' : ''}>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onSelect={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className={`space-y-4 ${isSummaryEdit ? 'opacity-50' : ''}`}>
              <FormLabel>Buy Amount(s) (SOL)</FormLabel>
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
                    disabled={isSummaryEdit}
                    readOnly={isSummaryEdit}
                  />
                  {!isSummaryEdit && buys.length > 1 && (
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
              {!isSummaryEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBuys([...buys, { amount: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Buy
                </Button>
              )}
            </div>

            <div className={`space-y-4 ${isSummaryEdit ? 'opacity-50' : ''}`}>
              <FormLabel>Sell Amount(s) (SOL)</FormLabel>
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
                    disabled={isSummaryEdit}
                    readOnly={isSummaryEdit}
                  />
                  {!isSummaryEdit && sells.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSells(sells.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isSummaryEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSells([...sells, { amount: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sell
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name="tokenAmount"
              render={({ field }) => (
                <FormItem className={isSummaryEdit ? 'opacity-50' : ''}>
                  <FormLabel>Token Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      placeholder="Amount of token bought/sold"
                      disabled={isSummaryEdit}
                      readOnly={isSummaryEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  {field.value?.includes("Other") && (
                    <Input
                      placeholder="Describe your setup..."
                      value={customSetup}
                      onChange={(e) => setCustomSetup(e.target.value)}
                      className="mt-2"
                    />
                  )}
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
                  {field.value?.includes("Other") && (
                    <Input
                      placeholder="Describe your emotion..."
                      value={customEmotion}
                      onChange={(e) => setCustomEmotion(e.target.value)}
                      className="mt-2"
                    />
                  )}
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
                  {field.value?.includes("Other") && (
                    <Input
                      placeholder="Describe your mistake..."
                      value={customMistake}
                      onChange={(e) => setCustomMistake(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Add notes..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-[-24px] bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-t flex justify-end gap-4 p-4 mt-8 -mx-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" data-button="close">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  createTradeMutation.isPending || updateTradeMutation.isPending || upsertSummaryMutation.isPending
                }
                className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
              >
                {(createTradeMutation.isPending ||
                  updateTradeMutation.isPending ||
                  upsertSummaryMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSummaryEdit ? "Save Summary" : (editingTrade ? "Update Trade" : "Save Trade")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </DialogContent>
  );
}
