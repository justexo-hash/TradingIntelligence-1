import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, UserPlus, LogIn } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, signIn, signInEmail, register, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Only redirect after all hooks are called
  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const handleSignIn = async (provider: string) => {
    await signIn(provider);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isRegistering) {
      await register(values.email, values.password);
    } else {
      await signInEmail(values.email, values.password);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-13 w-70 mb-2" />
            <CardTitle className="text-2xl font-bold">
              {isRegistering ? "Create an Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isRegistering
                ? "Join our community of traders and start tracking your performance"
                : "Sign in to access your trading journal and insights"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className={`w-full ${isRegistering ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRegistering ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-muted-foreground"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    form.reset();
                  }}
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Register"}
                </Button>
              </form>
            </Form>

            <div className="relative w-full my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

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