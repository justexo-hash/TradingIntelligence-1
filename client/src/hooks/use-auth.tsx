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

  useEffect(() => {
    console.log('Setting up auth state listener on:', currentHost);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed on', currentHost, ':', user ? 'User logged in' : 'No user');

      if (user) {
        try {
          // Always force a token refresh when auth state changes
          const token = await user.getIdToken(true);
          console.log('Token refreshed on auth state change:', {
            success: !!token,
            uid: user.uid,
            email: user.email,
            hostname: currentHost,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to refresh token:', {
            error,
            uid: user.uid,
            hostname: currentHost,
            timestamp: new Date().toISOString()
          });
        }
      }

      setUser(user);
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up auth state listener on:', currentHost);
      unsubscribe();
    };
  }, [currentHost]);

  const signIn = async (provider: string) => {
    try {
      console.log(`Attempting to sign in with ${provider} on ${currentHost}`);
      const user = await signInWithProvider(provider);
      if (user) {
        console.log('Sign in successful, requesting fresh token on:', currentHost);
        await user.getIdToken(true);
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
      console.log('Attempting email sign in on:', currentHost);
      const user = await signInWithEmail(email, password);
      if (user) {
        console.log('Email sign in successful, requesting fresh token on:', currentHost);
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
      console.log('Attempting registration on:', currentHost);
      const user = await registerWithEmail(email, password);
      if (user) {
        console.log('Registration successful, requesting fresh token on:', currentHost);
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
      console.log('Attempting sign out on:', currentHost);
      await signOutUser();
      console.log('Sign out successful on:', currentHost);
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