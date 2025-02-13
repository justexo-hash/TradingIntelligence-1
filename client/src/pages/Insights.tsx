import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Insight } from "@shared/schema";
import { formatInsightContent } from "@/lib/ai";
import { cn } from "@/lib/utils";

export default function Insights() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});

  const { data: insights, error, isLoading } = useQuery<Insight[]>({
    queryKey: ["/api/insights"],
    enabled: !!user,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/insights/generate");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate insights");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
      toast({
        title: "Success",
        description: "New insights have been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleInsight = (insightId: number) => {
    setExpandedInsights(prev => ({
      ...prev,
      [insightId]: !prev[insightId]
    }));
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="text-center text-red-500">
          Failed to load insights. Please try refreshing the page.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold md:text-4xl text-[#00ff99] [text-shadow:0_0_10px_#00ff99,0_0_20px_#00ff99,0_0_30px_#00ff99]">Insights</h1>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !user}
          className="bg-gradient-to-r from-[rgb(var(--solana-green))] to-[rgb(var(--solana-purple))] hover:opacity-90"
        >
          {generateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Generate New Insight
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="grid gap-4">
          {insights?.map((insight) => (
            <Card key={insight.id} className="p-6 bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg border-none relative">
              <div className="flex justify-between items-start">
                <p className="text-sm text-muted-foreground">
                  {new Date(insight.date).toLocaleDateString()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleInsight(insight.id)}
                  className="p-0 h-8 w-8"
                >
                  {expandedInsights[insight.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div
                className={cn(
                  "whitespace-pre-wrap overflow-hidden transition-[max-height] duration-300 ease-in-out",
                  expandedInsights[insight.id] ? "max-h-[1000px]" : "max-h-24"
                )}
              >
                {formatInsightContent(insight.content)}
              </div>
              {!expandedInsights[insight.id] && insight.content.length > 150 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-background" />
              )}
            </Card>
          ))}
          {insights?.length === 0 && (
            <div className="text-center text-muted-foreground">
              No insights available. Generate your first insight using the button above.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}