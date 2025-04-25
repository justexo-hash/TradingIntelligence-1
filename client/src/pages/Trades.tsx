import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PlusCircle, Pencil, Trash2, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trade, TrackedWallet, ActivePosition, GroupedTradeHistory } from "@shared/schema";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import SummaryNotesForm from "@/components/forms/SummaryNotesForm";

type SortOption = "name" | "date" | "pnl" | "buyAmount";

const shareTradeSchema = z.object({
  analysis: z
    .string()
    .min(1, "Analysis is required")
    .max(1000, "Analysis must be less than 1000 characters"),
});

type ShareTradeForm = z.infer<typeof shareTradeSchema>;

export default function Trades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharingTrade, setSharingTrade] = useState<GroupedTradeHistory | null>(null);
  const [selectedSummaryItem, setSelectedSummaryItem] = useState<GroupedTradeHistory | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [newWalletAddress, setNewWalletAddress] = useState("");

  const shareForm = useForm<ShareTradeForm>({
    resolver: zodResolver(shareTradeSchema),
    defaultValues: {
      analysis: "",
    },
  });

  const { data: trackedWallets, isLoading: isLoadingWallets } = useQuery<TrackedWallet[]>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });

  const { data: activePositions, isLoading: isLoadingPositions } = useQuery<ActivePosition[]>({
    queryKey: ['/api/positions'],
    enabled: !!user,
  });

  const { data: groupedHistory, isLoading: isLoadingHistory, isError, error } = useQuery<GroupedTradeHistory[]>({
    queryKey: ['/api/trades/grouped'],
    enabled: !!user,
  });

  console.log('Grouped History Query:', { 
    isLoading: isLoadingHistory, 
    isError, 
    error, 
    data: groupedHistory 
  });

  const addWalletMutation = useMutation({
    mutationFn: async (address: string) => {
      return apiRequest("POST", "/api/wallets", { address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setNewWalletAddress("");
      toast({ title: "Success", description: "Wallet added for tracking." });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || "Failed to add wallet. Ensure the address is valid and not already tracked.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (address: string) => {
      return apiRequest("DELETE", `/api/wallets/${encodeURIComponent(address)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      toast({ title: "Success", description: "Wallet removed." });
    },
    onError: () => {
       toast({ title: "Error", description: "Failed to remove wallet.", variant: "destructive" });
    },
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
    mutationFn: async ({
      tradeId,
      analysis,
    }: {
      tradeId: number;
      analysis: string;
    }) => {
      return apiRequest("POST", "/api/shared-trades", { tradeId, analysis });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user data for experience
      toast({
        title: "Success",
        description:
          "Trade shared successfully. You earned 10 experience points!",
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

  const onShareSubmit = (data: ShareTradeForm) => {
    if (!sharingTrade) return;
    console.log("Sharing analysis for:", sharingTrade.contractAddress, data.analysis);
    toast({ title: "Info", description: "Sharing from summary view not fully implemented yet." });
    setSharingTrade(null);
    shareForm.reset();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold md:text-4xl text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">
            Trades
          </h1>
        </div>
        <Dialog onOpenChange={(open) => !open && setSelectedSummaryItem(null)}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trade
            </Button>
          </DialogTrigger>
          <TradeForm editingTrade={null} isSummaryEdit={false} />
        </Dialog>
      </div>

      <Card className="mb-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none">
        <CardHeader>
          <CardTitle className="text-xl text-[rgb(var(--solana-purple))]">
            Tracked Wallets
          </CardTitle>
          <CardDescription>
            Add Solana wallet addresses to automatically fetch trades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Enter Solana wallet address..."
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              className="bg-black/50 border-neutral-700 focus:ring-[rgb(var(--solana-purple))]"
              disabled={addWalletMutation.isPending}
            />
            <Button
              onClick={() => addWalletMutation.mutate(newWalletAddress)}
              disabled={!newWalletAddress || addWalletMutation.isPending}
              className="bg-gradient-to-r from-[rgb(var(--solana-purple))] to-[rgb(var(--solana-green))] hover:opacity-90"
            >
              {addWalletMutation.isPending ? "Adding..." : "Add Wallet"}
            </Button>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Currently Tracking:</h4>
            {isLoadingWallets ? (
              <p className="text-sm text-muted-foreground">Loading wallets...</p>
            ) : trackedWallets && trackedWallets.length > 0 ? (
              <ul className="space-y-2">
                {trackedWallets.map((wallet) => (
                  <li key={wallet.id} className="flex justify-between items-center bg-black/30 p-2 rounded">
                    <span className="text-sm font-mono truncate pr-2" title={wallet.address}>
                      {wallet.address}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWalletMutation.mutate(wallet.address)}
                      disabled={deleteWalletMutation.isPending && deleteWalletMutation.variables === wallet.address}
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No wallets are being tracked yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tokenSummary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="positions">Active Positions</TabsTrigger>
          <TabsTrigger value="tokenSummary">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card className="bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none">
            <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[calc(100vh-22rem)]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token</TableHead>
                                <TableHead className="text-right">Amount Held</TableHead>
                                <TableHead className="text-right">Avg Buy Price (SOL)</TableHead>
                                <TableHead className="text-right">Total Cost (SOL)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPositions ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Loading positions...</TableCell></TableRow>
                            ) : activePositions && activePositions.length > 0 ? (
                                activePositions.map((pos) => (
                                    <TableRow key={pos.contractAddress}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {pos.tokenImage && <img src={pos.tokenImage} alt={pos.tokenName || 'Token'} className="h-6 w-6 rounded-full" />}
                                                <div>
                                                    <div>{pos.tokenName || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">{pos.tokenSymbol || pos.contractAddress.substring(0,6)}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{parseFloat(pos.remainingTokenAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                                        <TableCell className="text-right">{pos.avgBuyPriceSol ? parseFloat(pos.avgBuyPriceSol).toFixed(6) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">{parseFloat(pos.totalSolSpent).toFixed(4)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center">No active positions found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokenSummary">
          <ScrollArea className="h-[calc(100vh-18rem)]">
            <div className="grid gap-4">
              {isLoadingHistory ? (
                <p className="text-center text-muted-foreground">Loading history...</p>
              ) : !isError && groupedHistory && groupedHistory.length > 0 ? (
                groupedHistory.map((item: GroupedTradeHistory) => {
                    console.log(`[TradesPage] Rendering item ${item.contractAddress} with lastActivityDate: ${item.lastActivityDate}`);
                    return (
                        <Card
                            key={item.contractAddress} 
                            className="p-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-3 mb-2 flex-grow min-w-0">
                                    {item.tokenImage && (
                                        <img src={item.tokenImage} alt={item.tokenName || 'Token'} className="h-10 w-10 rounded-full flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto font-semibold text-lg hover:text-[rgb(var(--solana-green))] truncate block text-left"
                                            title={item.tokenName || item.contractAddress}
                                            onClick={() => window.open(`https://pump.fun/coin/${item.contractAddress}`, "_blank")}
                                        >
                                            {item.tokenName || item.contractAddress.substring(0, 10) + '...'}
                                        </Button>
                                        <div className="text-xs text-muted-foreground">
                                            {item.tokenSymbol || '-'}
                                            <span className="mx-1">·</span>
                                            Last Activity: {new Date(item.lastActivityDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-medium text-muted-foreground">Realized PNL</p>
                                    <p className={`text-lg font-bold ${parseFloat(item.realizedPnlSol) >= 0 ? 'text-[rgb(var(--solana-green))]' : 'text-red-500'}`}>
                                        {parseFloat(item.realizedPnlSol) >= 0 ? '+' : ''}{parseFloat(item.realizedPnlSol).toFixed(4)} SOL
                                    </p>
                                    <div className="flex gap-1 justify-end mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-xs"
                                            onClick={() => { 
                                                setSelectedSummaryItem(item);
                                                setIsSummaryModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-3 w-3 mr-1" /> Edit Summary
                                        </Button>
                                        <Dialog open={sharingTrade?.contractAddress === item.contractAddress} onOpenChange={(open) => !open && setSharingTrade(null)}>
                                            <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSharingTrade(item)}><Share2 className="h-3 w-3 mr-1" /> Share</Button></DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Share Token Summary</DialogTitle>
                                                    <DialogDescription>
                                                        Share your overall analysis for {item.tokenName || item.contractAddress}.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <Form {...shareForm}>
                                                    <form onSubmit={shareForm.handleSubmit(onShareSubmit)} className="space-y-4">
                                                        <FormField control={shareForm.control} name="analysis" render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Analysis</FormLabel>
                                                                <FormControl><Textarea placeholder="Share thoughts..." {...field} /></FormControl>
                                                            </FormItem>
                                                        )}/>
                                                        <DialogFooter>
                                                            <Button type="submit" /* disabled={shareTradeMutation.isPending} */ > {/* Re-enable when mutation fixed */}
                                                                {/* {shareTradeMutation.isPending ? "Sharing..." : "Share"} */} Share
                                                            </Button>
                                                        </DialogFooter>
                                                    </form>
                                                </Form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 border-t pt-4 text-sm">
                                <div><span className="text-muted-foreground">Total Bought:</span><br />{parseFloat(item.totalTokenBought).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div><span className="text-muted-foreground">Total Sold:</span><br />{parseFloat(item.totalTokenSold).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                <div><span className="text-muted-foreground">Total Spent (SOL):</span><br />{parseFloat(item.totalSolSpent).toFixed(4)}</div>
                                <div><span className="text-muted-foreground">Total Received (SOL):</span><br />{parseFloat(item.totalSolReceived).toFixed(4)}</div>
                            </div>
                        </Card>
                    );
                })
              ) : (
                <p className="text-center text-muted-foreground">No trade history found.</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={isSummaryModalOpen} onOpenChange={setIsSummaryModalOpen}>
        {selectedSummaryItem && user && (
          <SummaryNotesForm 
            userId={user.id}
            contractAddress={selectedSummaryItem.contractAddress}
            tokenName={selectedSummaryItem.tokenName}
            onClose={() => setIsSummaryModalOpen(false)} 
          />
        )}
      </Dialog>
    </div>
  );
}
