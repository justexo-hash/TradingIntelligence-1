import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut 
} from "firebase/auth";

// Get the current hostname for dynamic authDomain configuration
const currentHostname = window.location.hostname;
const isLocalhost = currentHostname.includes('localhost') || currentHostname.includes('replit.dev');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Use the replit.app domain for production, and localhost for development
  authDomain: isLocalhost 
    ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
    : 'trading-intelligence-1-kroleonleon.replit.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Initializing Firebase with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentHostname,
  isLocalhost
});

// Initialize Firebase with error handling
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize provider
const googleProvider = new GoogleAuthProvider();

// Add scopes for additional permissions if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Generic sign in function that takes a provider
export const signInWithProvider = async (providerName: string) => {
  try {
    console.log(`Attempting to sign in with ${providerName}...`);
    if (providerName.toLowerCase() !== 'google') {
      throw new Error('Only Google sign in is supported');
    }

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in, requesting token...");
    const token = await result.user.getIdToken(true);
    console.log("Token received:", token ? "Valid token" : "No token received");
    return result.user;
  } catch (error: any) {
    console.error(`Error signing in with ${providerName}: `, error);
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Please add ${window.location.hostname} to Firebase Console's Authorized Domains list.`);
    }
    if (error.code === 'auth/configuration-not-found') {
      throw new Error("Firebase configuration error. Please check your Firebase setup and authorized domains.");
    }
    throw error;
  }
};

// Email/Password authentication
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully signed in with email");
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with email: ", error);
    if (error.code === 'auth/user-not-found') {
      throw new Error("No account exists with this email address.");
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password.");
    }
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Successfully registered with email");
    return result.user;
  } catch (error: any) {
    console.error("Error registering with email: ", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("An account already exists with this email address.");
    }
    if (error.code === 'auth/weak-password') {
      throw new Error("Password should be at least 6 characters long.");
    }
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("Successfully signed out");
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

// Add token refresh and verification
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log('Auth state changed: User is signed in');
    try {
      const token = await user.getIdToken(true);
      console.log('Token refreshed:', token ? 'Valid token received' : 'No token received');
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  } else {
    console.log('Auth state changed: User is signed out');
  }
});

export { auth };