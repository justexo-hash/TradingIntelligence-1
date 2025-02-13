import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Initialize Firebase configuration
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  currentHostname: window.location.hostname,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase with error handling
let app;
try {
  // Ensure Firebase is only initialized once
  if (!globalThis.firebase) {
    app = initializeApp(firebaseConfig);
    globalThis.firebase = app;
    console.log('Firebase initialized successfully on:', window.location.hostname);
  } else {
    app = globalThis.firebase;
    console.log('Using existing Firebase instance on:', window.location.hostname);
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw error;
}

const auth = getAuth(app);

// Initialize provider with error handling
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Generic sign in function that takes a provider
export const signInWithProvider = async (providerName: string) => {
  try {
    console.log(`Attempting to sign in with ${providerName} on ${window.location.hostname}`);
    if (providerName.toLowerCase() !== 'google') {
      throw new Error('Only Google sign in is supported');
    }

    // Force token refresh before sign in
    await auth.signOut();

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google");

    // Force token refresh and verify we can get a token
    const token = await result.user.getIdToken(true);
    console.log("Token obtained after sign in:", {
      success: !!token,
      uid: result.user.uid,
      hostname: window.location.hostname
    });

    return result.user;
  } catch (error: any) {
    console.error(`Error signing in with ${providerName}:`, error);

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
    // Force token refresh before sign in
    await auth.signOut();

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
    console.log("Successfully signed out on:", window.location.hostname);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Add token refresh and verification with more detailed logging
onAuthStateChanged(auth, async (user) => {
  const currentHost = window.location.hostname;
  console.log('Auth state changed on', currentHost, ':', user ? 'User logged in' : 'No user');

  if (user) {
    try {
      const token = await user.getIdToken(true);
      console.log('Token refresh result:', {
        success: !!token,
        uid: user.uid,
        email: user.email,
        hostname: currentHost,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Token refresh failed:', {
        error,
        uid: user.uid,
        hostname: currentHost,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// Export singleton instances
export { auth };