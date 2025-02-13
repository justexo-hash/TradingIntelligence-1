import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface BalanceFormProps {
  isNewUser?: boolean;
  currentBalance?: string;
  onClose?: () => void;
}

export default function BalanceForm({ isNewUser, currentBalance, onClose }: BalanceFormProps) {
  const { toast } = useToast();
  const [balance, setBalance] = useState(currentBalance || "");

  const updateBalanceMutation = useMutation({
    mutationFn: async (newBalance: string) => {
      console.log("Updating balance to:", newBalance);
      const response = await apiRequest("PATCH", "/api/user/balance", { balance: newBalance });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update balance");
      }
      const updatedUser = await response.json();
      console.log("Server response:", updatedUser);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      // Update all affected queries
      queryClient.setQueryData(["/api/user"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });

      toast({
        title: "Success",
        description: "Account balance updated successfully.",
      });

      if (onClose) onClose();
    },
    onError: (error: Error) => {
      console.error("Balance update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update balance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance || isNaN(Number(balance))) {
      toast({
        title: "Error",
        description: "Please enter a valid balance",
        variant: "destructive",
      });
      return;
    }
    console.log("Submitting balance:", balance);
    updateBalanceMutation.mutate(balance);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isNewUser ? "Welcome!" : "Update Balance"}</DialogTitle>
        <DialogDescription>
          {isNewUser
            ? "Please enter your starting account balance to get started."
            : "Update your current account balance."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="number"
            step="0.000001"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Enter balance in SOL"
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-4">
          {!isNewUser && (
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          )}
          <Button
            type="submit"
            disabled={updateBalanceMutation.isPending}
            className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
          >
            {updateBalanceMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isNewUser ? "Start Trading" : "Update Balance"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}