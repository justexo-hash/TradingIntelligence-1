import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useBalance } from "@/hooks/use-balance";
import {
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
  const { balance, updateBalance, isUpdating } = useBalance();
  const [inputBalance, setInputBalance] = useState(currentBalance || balance || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBalance || isNaN(Number(inputBalance))) {
      toast({
        title: "Error",
        description: "Please enter a valid balance",
        variant: "destructive",
      });
      return;
    }
    console.log("Submitting balance:", inputBalance);
    updateBalance(inputBalance);
    if (onClose) onClose();
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
            value={inputBalance}
            onChange={(e) => setInputBalance(e.target.value)}
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
            disabled={isUpdating}
            className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
          >
            {isUpdating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isNewUser ? "Start Trading" : "Update Balance"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}