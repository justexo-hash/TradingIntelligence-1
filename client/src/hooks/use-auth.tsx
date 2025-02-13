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

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        try {
          // Force token refresh on auth state change
          const token = await user.getIdToken(true);
          console.log('Token refreshed on auth state change:', token ? 'Valid token' : 'No token');
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
      setUser(user);
      setIsLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const signIn = async (provider: string) => {
    try {
      console.log(`Attempting to sign in with ${provider}...`);
      const user = await signInWithProvider(provider);
      if (user) {
        console.log('Sign in successful, requesting fresh token');
        await user.getIdToken(true); // Force token refresh after sign in
      }
      return user;
    } catch (error) {
      const e = error as Error;
      console.error('Sign in error:', e);
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
      console.log('Attempting email sign in...');
      const user = await signInWithEmail(email, password);
      if (user) {
        console.log('Email sign in successful, requesting fresh token');
        await user.getIdToken(true);
      }
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
      console.log('Attempting registration...');
      const user = await registerWithEmail(email, password);
      if (user) {
        console.log('Registration successful, requesting fresh token');
        await user.getIdToken(true);
      }
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
      console.log('Attempting sign out...');
      await signOutUser();
      console.log('Sign out successful');
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