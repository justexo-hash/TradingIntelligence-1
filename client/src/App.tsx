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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
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