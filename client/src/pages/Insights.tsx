import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Insight } from "@shared/schema";
import { formatInsightContent } from "@/lib/ai";

export default function Insights() {
  const { toast } = useToast();

  const { data: insights } = useQuery<Insight[]>({
    queryKey: ["/api/insights/1"], // TODO: Replace with actual user ID
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1 }), // TODO: Replace with actual user ID
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate insights");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights/1"] });
      toast({
        title: "Success",
        description: "New insights have been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Insights</h1>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Generate New Insight
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {insights?.map((insight) => (
            <Card key={insight.id} className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(insight.date).toLocaleDateString()}
              </p>
              <div className="whitespace-pre-wrap">
                {formatInsightContent(insight.content)}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}