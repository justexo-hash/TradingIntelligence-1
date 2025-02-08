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
    <div className="flex h-full w-64 flex-col bg-black border-r border-[rgb(var(--solana-green))/0.2]">
      <div className="flex h-16 items-center px-6 border-b border-[rgb(var(--solana-green))/0.2]">
        <img src="/logo.png" alt="Logo" className="h-30 w-30" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive
                  ? "bg-[rgb(var(--solana-green))/0.1] text-[rgb(var(--solana-green))]"
                  : "text-foreground hover:bg-[rgb(var(--solana-green))/0.05]",
                "group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              )}
            >
              <item.icon
                className={cn(
                  isActive
                    ? "text-[rgb(var(--solana-green))]"
                    : "text-foreground",
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[rgb(var(--solana-green))/0.2] p-4">
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center px-4 py-2 text-sm font-medium text-foreground hover:bg-[rgb(var(--solana-green))/0.05] rounded-md transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
