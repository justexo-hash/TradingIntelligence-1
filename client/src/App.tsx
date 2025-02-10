import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Journal from "@/pages/Journal";
import Trades from "@/pages/Trades";
import Insights from "@/pages/Insights";
import QuickGuide from "@/pages/QuickGuide";
import AuthPage from "@/pages/auth";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { SiX } from "react-icons/si";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
        <footer className="mt-16 border-t border-[rgb(var(--solana-green))]/5 pt-8 px-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="max-w-2xl">
              <h4 className="text-lg font-semibold mb-2">Privacy Policy</h4>
              <p className="text-sm text-muted-foreground">
                We respect your privacy and do not collect or share any personal information or trading data. All your trades, journal entries, and insights are stored securely and are only accessible to you. We do not use your data for any purposes other than providing you with the trading journal functionality.
              </p>
            </div>
            <a
              href="https://twitter.com/justexo_sol"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--solana-green))]/10 hover:bg-[rgb(var(--solana-green))]/20 transition-colors duration-300"
            >
              <SiX className="h-5 w-5" />
              <span className="text-sm font-medium">Follow us on X</span>
            </a>
          </div>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute
        path="/"
        component={() => (
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        )}
      />
      <ProtectedRoute
        path="/journal"
        component={() => (
          <ProtectedLayout>
            <Journal />
          </ProtectedLayout>
        )}
      />
      <ProtectedRoute
        path="/trades"
        component={() => (
          <ProtectedLayout>
            <Trades />
          </ProtectedLayout>
        )}
      />
      <ProtectedRoute
        path="/insights"
        component={() => (
          <ProtectedLayout>
            <Insights />
          </ProtectedLayout>
        )}
      />
      <ProtectedRoute
        path="/guide"
        component={() => (
          <ProtectedLayout>
            <QuickGuide />
          </ProtectedLayout>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;