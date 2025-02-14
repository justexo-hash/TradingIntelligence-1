import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, UserPlus, LogIn, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
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

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, signIn, register, isLoading, requestPasswordReset } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  if (user) {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isRegistering) {
      await register(values.email, values.password);
    } else {
      await signIn(values.email, values.password);
    }
  };

  const onForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
    await requestPasswordReset(values.email);
    setIsForgotPassword(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center">
            <img src="/logo.png" alt="Logo" className="h-13 w-70 mb-2" />
            <CardTitle className="text-2xl font-bold">
              {isForgotPassword
                ? "Reset Password"
                : isRegistering
                ? "Create an Account"
                : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isRegistering
                ? "Join our community of traders and start tracking your performance"
                : "Sign in to access your trading journal and insights"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isForgotPassword ? (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="w-full space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setIsForgotPassword(false);
                      forgotPasswordForm.reset();
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
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
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                          />
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
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="link"
                      className="text-muted-foreground"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        form.reset();
                      }}
                    >
                      {isRegistering
                        ? "Already have an account? Sign in"
                        : "Don't have an account? Register"}
                    </Button>
                    {!isRegistering && (
                      <Button
                        type="button"
                        variant="link"
                        className="text-muted-foreground"
                        onClick={() => {
                          setIsForgotPassword(true);
                          form.reset();
                        }}
                      >
                        Forgot your password?
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            )}
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