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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (provider: string) => {
    try {
      const user = await signInWithProvider(provider);
      return user;
    } catch (error) {
      const e = error as Error;
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
      const user = await signInWithEmail(email, password);
      return user;
    } catch (error) {
      const e = error as Error;
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
      const user = await registerWithEmail(email, password);
      return user;
    } catch (error) {
      const e = error as Error;
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
      await signOutUser();
    } catch (error) {
      const e = error as Error;
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