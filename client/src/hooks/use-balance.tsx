import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const BALANCE_KEY = "trading_journal_balance";

export function useBalance() {
  const { toast } = useToast();
  const [localBalance, setLocalBalance] = useState(() => {
    const saved = localStorage.getItem(BALANCE_KEY);
    return saved || "0";
  });

  // Keep track of server balance
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Update local storage when server data changes
  useEffect(() => {
    if (userData?.accountBalance) {
      localStorage.setItem(BALANCE_KEY, userData.accountBalance);
      setLocalBalance(userData.accountBalance);
    }
  }, [userData?.accountBalance]);

  const updateBalance = useMutation({
    mutationFn: async (newBalance: string) => {
      // Immediately update local state
      localStorage.setItem(BALANCE_KEY, newBalance);
      setLocalBalance(newBalance);

      // Send to server
      const response = await apiRequest("PATCH", "/api/user/balance", { balance: newBalance });
      const data = await response.json();
      
      if (!response.ok) {
        // Rollback on error
        const oldBalance = userData?.accountBalance || "0";
        localStorage.setItem(BALANCE_KEY, oldBalance);
        setLocalBalance(oldBalance);
        throw new Error(data.error || "Failed to update balance");
      }

      return data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Success",
        description: "Account balance updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update balance",
        variant: "destructive",
      });
    },
  });

  return {
    balance: localBalance,
    updateBalance: (newBalance: string) => updateBalance.mutate(newBalance),
    isUpdating: updateBalance.isPending
  };
}
