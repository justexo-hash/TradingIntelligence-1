import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, signIn, isLoading } = useAuth();

  // Only redirect after all hooks are called
  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const handleGoogleSignIn = async () => {
    await signIn();
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-13 w-70 mb-2" />
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Your personal trading journal and performance analyzer
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiGoogle className="h-4 w-4" />
              )}
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex items-center justify-center p-8 bg-muted">
        <img
          src="/login-hero.png"
          alt="Trading Journey"
          className="max-w-md w-full object-contain"
        />
      </div>
    </div>
  );
}