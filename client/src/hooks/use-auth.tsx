import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, signInWithProvider, signInWithEmail, registerWithEmail, signOutUser } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (provider: string) => Promise<FirebaseUser | null>;
  signInEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  register: (email: string, password: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const currentHost = window.location.hostname;
  const isDevelopment = !import.meta.env.PROD && !currentHost.includes('trademate.live');

  console.log('Auth environment:', {
    isDevelopment,
    currentHost,
    isCustomDomain: currentHost === 'trademate.live',
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY
  });

  useEffect(() => {
    console.log('Setting up auth state listener on:', currentHost);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', {
        host: currentHost,
        isAuthenticated: !!user,
        environment: isDevelopment ? 'development' : 'production'
      });

      if (user) {
        try {
          // Force token refresh on production
          const token = await user.getIdToken(!isDevelopment);
          console.log('Token refresh status:', {
            success: !!token,
            uid: user.uid,
            email: user.email,
            host: currentHost,
            environment: isDevelopment ? 'development' : 'production'
          });
        } catch (error) {
          console.error('Token refresh failed:', {
            error,
            host: currentHost,
            environment: isDevelopment ? 'development' : 'production'
          });

          // Show error to user and force re-login
          toast({
            title: "Authentication Error",
            description: "Please sign in again",
            variant: "destructive",
          });
          await signOut();
          return;
        }
      }

      setUser(user);
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener on:', currentHost);
      unsubscribe();
    };
  }, [currentHost, toast, isDevelopment]);

  const signIn = async (provider: string) => {
    try {
      setError(null);
      console.log(`Attempting to sign in with ${provider} on ${currentHost}`);
      const user = await signInWithProvider(provider);
      return user;
    } catch (error) {
      const e = error as Error;
      console.error('Sign in error:', {
        error: e,
        host: currentHost,
        environment: isDevelopment ? 'development' : 'production'
      });
      setError(e);
      toast({
        title: "Sign in failed",
        description: e.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const signInEmail = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Attempting email sign in on:', currentHost);
      const user = await signInWithEmail(email, password);
      return user;
    } catch (error) {
      const e = error as Error;
      console.error('Email sign in error:', e);
      setError(e);
      toast({
        title: "Sign in failed",
        description: e.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('Attempting registration on:', currentHost);
      const user = await registerWithEmail(email, password);
      return user;
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
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('Attempting sign out on:', currentHost);
      await signOutUser();
      setUser(null);
    } catch (error) {
      const e = error as Error;
      console.error('Sign out error:', e);
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
        signInEmail,
        register,
        signOut,
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