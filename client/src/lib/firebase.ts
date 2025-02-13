import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase with error handling
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Add scopes for additional permissions if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Generic sign in function that takes a provider
export const signInWithProvider = async (providerName: string) => {
  try {
    console.log(`Attempting to sign in with ${providerName}...`);
    let provider;
    switch (providerName.toLowerCase()) {
      case 'google':
        provider = googleProvider;
        break;
      case 'github':
        provider = githubProvider;
        break;
      case 'twitter':
        provider = twitterProvider;
        break;
      case 'facebook':
        provider = facebookProvider;
        break;
      default:
        throw new Error('Unsupported provider');
    }

    const result = await signInWithPopup(auth, provider);
    console.log("Successfully signed in");
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

export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("Successfully signed out");
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

export { auth };