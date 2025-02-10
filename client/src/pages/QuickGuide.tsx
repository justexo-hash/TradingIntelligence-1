import { Card } from "@/components/ui/card";
import { ChartLine, BookText, BarChart3, Brain } from "lucide-react";

export default function QuickGuide() {
  const features = [
    {
      title: "Dashboard",
      icon: ChartLine,
      description: "See all of your most important stats at a glance. Select a day on the calendar to see your trading activity. The performance chart will help you visualize your most important metrics.",
    },
    {
      title: "Daily Journal",
      icon: BookText,
      description: "Create entries with your trading notes and organize them into different folders for your convenience.",
    },
    {
      title: "Trades",
      icon: BarChart3,
      description: "Input your trade activity and update it as you go. Be sure to include details regarding your decisions in order for our AI processor to create helpful and accurate insights on your trading behaviour.",
    },
    {
      title: "Insights",
      icon: Brain,
      description: "After you have added trade data, you can create an 'insight' that will provide a breakdown of your trading history and suggestions for improvement.",
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-gradient-to-b from-black via-black/95 to-black/90 pb-20">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-4xl bg-gradient-to-r from-[rgb(var(--solana-green))] via-[rgb(var(--solana-purple))] to-[rgb(var(--solana-green))] bg-clip-text text-transparent">
            Quick Guide
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Learn how to get the most out of your trading journal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="p-6 border-none bg-gradient-to-br from-black/80 via-black/60 to-black/40 backdrop-blur-lg shadow-lg hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.2)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--solana-green))] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[rgb(var(--solana-green))]/0.1 rounded-2xl shadow-inner">
                  <feature.icon className="h-6 w-6 text-[rgb(var(--solana-green))]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}