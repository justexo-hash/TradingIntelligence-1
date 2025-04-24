import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  email: string;
  displayName: string;
  photoURL?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/session', { 
      credentials: 'include' // Important for cross-origin requests with cookies
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Session fetch failed: ' + res.status);
        }
        return res.json();
      })
      .then(data => {
        if (data.user) {
          console.log('Session loaded successfully:', data.user.email);
          setUser(data.user);
        } else {
          console.log('No active session found');
        }
      })
      .catch(error => {
        console.error("Session check error:", error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cross-origin requests with cookies
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      console.log('Login successful:', data.user);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const e = error as Error;
      console.error('Login error:', e);
      setError(e);
      toast({
        title: "Sign in failed",
        description: e.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cross-origin requests with cookies
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      console.log('Registration successful:', data.user);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const e = error as Error;
      console.error('Registration error:', e);
      setError(e);
      toast({
        title: "Registration failed",
        description: e.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cross-origin requests with cookies
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      const e = error as Error;
      console.error('Password reset request error:', e);
      setError(e);
      toast({
        title: "Password Reset Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cross-origin requests with cookies
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
      });
    } catch (error) {
      const e = error as Error;
      console.error('Password reset error:', e);
      setError(e);
      toast({
        title: "Password Reset Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' // Important for cross-origin requests with cookies
      });
      
      if (!res.ok) {
        throw new Error('Logout failed: ' + res.status);
      }
      
      console.log('Logout successful');
      setUser(null);
    } catch (error) {
      const e = error as Error;
      console.error('Logout error:', e);
      setError(e);
      toast({
        title: "Sign out failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        signIn,
        register,
        signOut,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}