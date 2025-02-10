import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  BookText,
  LineChart,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Journal",
      href: "/journal",
      icon: BookText,
    },
    {
      name: "Trades",
      href: "/trades",
      icon: LineChart,
    },
    {
      name: "Insights",
      href: "/insights",
      icon: Lightbulb,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "text-muted-foreground hover:text-foreground",
                isActive && "text-[rgb(var(--solana-green))]"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
