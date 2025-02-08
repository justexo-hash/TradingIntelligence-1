import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-border">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          My Trading Pal
        </h1>
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                "group flex items-center px-4 py-2 text-sm font-medium rounded-md",
              )}
            >
              <item.icon
                className={cn(
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground",
                  "mr-3 h-5 w-5 flex-shrink-0",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center px-4 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-md">
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
