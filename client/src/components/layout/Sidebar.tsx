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
    <div className="group hidden md:flex h-full w-20 hover:w-72 transition-all duration-300 flex-col bg-[rgb(var(--trade-bg))] border-r border-[rgb(var(--trade-green))]/20">
      <div className="flex h-16 items-center px-4 hover:px-8 transition-all duration-300 border-b border-[rgb(var(--trade-green))]/20">
        <img src="/logo.png" alt="Logo" className="h-8" />
      </div>

      <nav className="flex-1 space-y-2 p-2 transition-all duration-300 group-hover:p-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group/item relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                "hover:bg-[rgb(var(--trade-green))]/10",
                isActive
                  ? "bg-[rgb(var(--trade-green))]/20 text-[rgb(var(--trade-green))]"
                  : "text-[rgb(var(--trade-font))]/60 hover:text-[rgb(var(--trade-font))]"
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-1 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-[rgb(var(--trade-green))]"
                    : "bg-transparent group-hover/item:bg-[rgb(var(--trade-green))]/30"
                )}
              />

              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive
                    ? "text-[rgb(var(--trade-green))]"
                    : "text-[rgb(var(--trade-font))]/40 group-hover/item:text-[rgb(var(--trade-font))]/60"
                )}
              />

              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
                {item.name}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-[2px] w-0 bg-[rgb(var(--trade-green))] transition-all duration-300",
                    isActive || "group-hover/item:w-full"
                  )}
                />
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[rgb(var(--trade-green))]/20 p-2 group-hover:p-4 transition-all duration-300">
        <button
          onClick={() => logoutMutation.mutate()}
          className="group/item flex w-full items-center px-3 py-3 text-sm font-medium text-[rgb(var(--trade-font))]/60 hover:text-[rgb(var(--trade-font))] rounded-xl transition-all duration-300 hover:bg-[rgb(var(--trade-green))]/10"
        >
          <LogOut className="h-5 w-5 text-[rgb(var(--trade-font))]/40 group-hover/item:text-[rgb(var(--trade-font))]/60 transition-colors duration-300" />
          <span className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}