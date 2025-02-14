import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

// Initialize Firebase configuration
const currentHost = window.location.hostname;
const isCustomDomain = currentHost === 'trademate.live';

console.log('Firebase initialization:', {
  currentHost,
  isCustomDomain,
  hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isCustomDomain 
    ? 'trademate.live' 
    : `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase persistence set to LOCAL on:', currentHost);
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

// Initialize provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Sign in with provider (Google)
export const signInWithProvider = async (providerName: string) => {
  try {
    console.log(`Attempting to sign in with ${providerName}`, {
      currentHost,
      isCustomDomain,
      authDomain: firebaseConfig.authDomain
    });

    if (providerName.toLowerCase() !== 'google') {
      throw new Error('Only Google sign in is supported');
    }

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google");

    // Force token refresh
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after sign in:", {
      success: !!token,
      uid: result.user.uid,
      email: result.user.email,
      host: currentHost
    });

    return result.user;
  } catch (error: any) {
    console.error(`Error signing in with ${providerName}:`, {
      error,
      code: error.code,
      message: error.message,
      currentHost,
      isCustomDomain
    });

    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Please ensure ${currentHost} is added to Firebase Console's Authorized Domains.`);
    }
    throw error;
  }
};

// Email/Password authentication
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting email sign in on:', currentHost);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully signed in with email");
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after email sign in:", {
      success: !!token,
      uid: result.user.uid,
      host: currentHost
    });
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with email:", error);
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
    console.log('Attempting registration on:', currentHost);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Successfully registered with email");

    // Force token refresh immediately after registration
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after registration:", {
      success: !!token,
      uid: result.user.uid,
      host: currentHost
    });
    return result.user;
  } catch (error: any) {
    console.error("Error registering with email:", error);
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
    console.log("Successfully signed out from:", currentHost);
    localStorage.removeItem('firebase:previous_websocket_failure');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Set up token refresh
let tokenRefreshTimeout: number | null = null;

onAuthStateChanged(auth, async (user) => {
  console.log('Auth state changed:', {
    status: user ? 'User logged in' : 'No user',
    host: currentHost
  });

  if (user) {
    try {
      // Initial token refresh
      const token = await user.getIdToken(true);
      console.log('Token refresh result:', {
        success: !!token,
        uid: user.uid,
        email: user.email,
        host: currentHost
      });

      // Set up periodic token refresh (every 30 minutes)
      if (tokenRefreshTimeout) {
        window.clearTimeout(tokenRefreshTimeout);
      }
      tokenRefreshTimeout = window.setInterval(async () => {
        try {
          const newToken = await user.getIdToken(true);
          console.log('Periodic token refresh successful:', {
            success: !!newToken,
            uid: user.uid,
            host: currentHost
          });
        } catch (error) {
          console.error('Periodic token refresh failed:', error);
        }
      }, 30 * 60 * 1000);

    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  } else {
    // Clear token refresh interval
    if (tokenRefreshTimeout) {
      window.clearTimeout(tokenRefreshTimeout);
      tokenRefreshTimeout = null;
    }
  }
});

export { auth };