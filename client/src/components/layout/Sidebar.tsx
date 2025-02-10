import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  BookText,
  LineChart,
  PieChart,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Daily Journal", href: "/journal", icon: BookText },
  { name: "Trades", href: "/trades", icon: LineChart },
  { name: "Insights", href: "/insights", icon: PieChart },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <div className="hidden md:flex h-full w-64 flex-col bg-black/95 backdrop-blur-sm border-r border-[rgb(var(--solana-green))/0.1]">
      <div className="flex h-16 items-center px-6 border-b border-[rgb(var(--solana-green))/0.1]">
        <img src="/logo.png" alt="Logo" className="h-8" />
      </div>
      <nav className="flex-1 space-y-2 px-3 py-6">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-[rgb(var(--solana-green))/0.15] text-[rgb(var(--solana-green))]"
                  : "text-foreground/80 hover:bg-[rgb(var(--solana-green))/0.05] hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-all duration-200",
                  isActive
                    ? "text-[rgb(var(--solana-green))]"
                    : "text-foreground/60 group-hover:text-foreground/80",
                )}
              />
              {item.name}
              {isActive && (
                <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-[rgb(var(--solana-green))]" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[rgb(var(--solana-green))/0.1] p-4">
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-[rgb(var(--solana-green))/0.05] hover:text-foreground rounded-xl transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5 text-foreground/60" />
          Sign Out
        </button>
      </div>
    </div>
  );
}