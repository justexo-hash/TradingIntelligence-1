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
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isProd = import.meta.env.VITE_PROD || window.location.hostname === 'trademate.live';
const currentHost = window.location.hostname;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: currentHost === 'trademate.live' 
    ? 'trademate.live' 
    : `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentHost,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  environment: isProd ? 'production' : 'development',
  isCustomDomain: currentHost === 'trademate.live'
});

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
    console.log(`Attempting to sign in with ${providerName} on ${currentHost}`, {
      isProd,
      authDomain: firebaseConfig.authDomain
    });

    if (providerName.toLowerCase() !== 'google') {
      throw new Error('Only Google sign in is supported');
    }

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google");

    // Force token refresh and verify we can get a token
    const token = await result.user.getIdToken(isProd);
    console.log("Token obtained after sign in:", {
      success: !!token,
      uid: result.user.uid,
      hostname: currentHost,
      isProd,
      tokenLength: token ? token.length : 0 //Added to handle potential null token
    });

    return result.user;
  } catch (error: any) {
    console.error(`Error signing in with ${providerName}:`, {
      error,
      host: currentHost,
      isProd,
      authDomain: firebaseConfig.authDomain
    });

    if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Please add ${currentHost} to Firebase Console's Authorized Domains list.`);
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
    console.log('Attempting email sign in on:', window.location.hostname);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Successfully signed in with email");
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after email sign in:", {
      success: !!token,
      uid: result.user.uid,
      hostname: window.location.hostname
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
    console.log('Attempting registration on:', window.location.hostname);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Successfully registered with email");
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after registration:", {
      success: !!token,
      uid: result.user.uid,
      hostname: window.location.hostname
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
    console.log("Successfully signed out");
    // Clear any cached tokens or state
    localStorage.removeItem('firebase:previous_websocket_failure');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Add token refresh handler with aggressive refresh on browser focus
let tokenRefreshTimeout: number | null = null;

onAuthStateChanged(auth, async (user) => {
  const currentHost = window.location.hostname;
  console.log('Auth state changed on', currentHost, ':', user ? 'User logged in' : 'No user');

  if (user) {
    try {
      // Initial token refresh
      const token = await user.getIdToken(true);
      console.log('Token refresh result:', {
        success: !!token,
        uid: user.uid,
        email: user.email,
        hostname: currentHost,
        timestamp: new Date().toISOString()
      });

      // Set up periodic token refresh (every 30 minutes)
      if (tokenRefreshTimeout) {
        window.clearTimeout(tokenRefreshTimeout);
      }
      tokenRefreshTimeout = window.setInterval(async () => {
        try {
          await user.getIdToken(true);
          console.log('Periodic token refresh successful');
        } catch (error) {
          console.error('Periodic token refresh failed:', error);
        }
      }, 30 * 60 * 1000);

      // Add focus listener for additional token refresh
      window.addEventListener('focus', async () => {
        try {
          await user.getIdToken(true);
          console.log('Token refreshed on window focus');
        } catch (error) {
          console.error('Token refresh on focus failed:', error);
        }
      });

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