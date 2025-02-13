import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { SiGoogle, SiGithub, SiX, SiFacebook } from "react-icons/si";
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

  const handleSignIn = async (provider: string) => {
    await signIn(provider);
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
              onClick={() => handleSignIn('google')}
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

            <Button
              onClick={() => handleSignIn('github')}
              className="w-full flex items-center justify-center gap-2 bg-[#24292e] hover:bg-[#2f363d]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiGithub className="h-4 w-4" />
              )}
              Sign in with GitHub
            </Button>

            <Button
              onClick={() => handleSignIn('twitter')}
              className="w-full flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a91da]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiX className="h-4 w-4" />
              )}
              Sign in with X (Twitter)
            </Button>

            <Button
              onClick={() => handleSignIn('facebook')}
              className="w-full flex items-center justify-center gap-2 bg-[#4267B2] hover:bg-[#365899]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiFacebook className="h-4 w-4" />
              )}
              Sign in with Facebook
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