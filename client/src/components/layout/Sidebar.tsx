import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  BookText,
  LineChart,
  PieChart,
  LogOut,
  HelpCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Daily Journal", href: "/journal", icon: BookText },
  { name: "Trades", href: "/trades", icon: LineChart },
  { name: "Insights", href: "/insights", icon: PieChart },
  { name: "Quick Guide", href: "/guide", icon: HelpCircle },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <div className="hidden md:flex h-full w-72 flex-col bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-xl border-r border-[rgb(var(--solana-green))]/5">
      <div className="flex h-16 items-center px-8 border-b border-[rgb(var(--solana-green))]/5">
        <img src="/logo.png" alt="Logo" className="h-30" />
      </div>

      <nav className="flex-1 space-y-2 px-4 py-8">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center px-6 py-4 text-sm font-medium rounded-2xl transition-all duration-300 overflow-hidden",
                "hover:bg-gradient-to-r hover:from-[rgb(var(--solana-green))]/10 hover:to-transparent",
                isActive
                  ? "bg-gradient-to-r from-[rgb(var(--solana-green))]/20 to-transparent text-[rgb(var(--solana-green))]"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-1 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-[rgb(var(--solana-green))]"
                    : "bg-transparent group-hover:bg-[rgb(var(--solana-green))]/30",
                )}
              />

              <item.icon
                className={cn(
                  "mr-4 h-5 w-5 transition-all duration-300",
                  isActive
                    ? "text-[rgb(var(--solana-green))]"
                    : "text-foreground/40 group-hover:text-foreground/60",
                )}
              />

              <span className="relative">
                {item.name}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-[2px] w-0 bg-[rgb(var(--solana-green))] transition-all duration-300",
                    isActive || "group-hover:w-full",
                  )}
                />
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[rgb(var(--solana-green))]/5 p-4">
        <button
          onClick={() => logoutMutation.mutate()}
          className="group flex w-full items-center px-6 py-4 text-sm font-medium text-foreground/60 hover:text-foreground rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[rgb(var(--solana-green))]/10 hover:to-transparent"
        >
          <LogOut className="mr-4 h-5 w-5 text-foreground/40 group-hover:text-foreground/60 transition-colors duration-300" />
          Sign Out
        </button>
      </div>
    </div>
  );
}