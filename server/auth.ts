import { auth as adminAuth } from "firebase-admin";
import { Express } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { storage } from "./storage";

// Initialize Firebase Admin with service account
try {
  const isCustomDomain = process.env.CUSTOM_DOMAIN === 'true';
  console.log('Initializing Firebase Admin:', {
    isCustomDomain,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
  });

  // Ensure proper formatting of private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!
    .replace(/\\n/g, '\n')
    .replace(/"([^"]*)"/, '$1');

  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error; // Re-throw to prevent silent failures
}

export function setupAuth(app: Express) {
  // Authentication middleware for API routes
  app.use(async (req: any, res: any, next: any) => {
    const currentHost = req.headers.host;
    const isCustomDomain = currentHost === 'trademate.live';

    console.log('Auth middleware check:', {
      currentHost,
      isCustomDomain,
      hasAuth: !!req.headers.authorization,
      method: req.method,
      path: req.path
    });

    const authHeader = req.headers.authorization;

    // Only allow development mode bypass on non-custom domain
    if (!authHeader?.startsWith('Bearer ')) {
      if (!isCustomDomain) {
        console.log('Development mode: Using mock user');
        const mockUser = await storage.getUserByFirebaseId('dev-user');
        if (!mockUser) {
          const newUser = await storage.createUser({
            firebaseId: 'dev-user',
            email: 'dev@example.com',
            displayName: 'Dev User',
            photoURL: '',
          });
          req.user = newUser;
        } else {
          req.user = mockUser;
        }
        return next();
      }

      console.error('Authentication required:', {
        host: currentHost,
        path: req.path,
        method: req.method
      });

      return res.status(401).json({ 
        error: "No authentication token provided",
        details: "Please sign in to access this resource"
      });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      console.log('Verifying Firebase token:', {
        currentHost,
        isCustomDomain,
        tokenLength: token.length,
        path: req.path
      });

      const decodedToken = await getAuth().verifyIdToken(token, true);  // Force token refresh check
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        host: currentHost,
        path: req.path
      });

      let user = await storage.getUserByFirebaseId(decodedToken.uid);
      console.log('Database user lookup result:', {
        found: !!user,
        uid: decodedToken.uid,
        path: req.path
      });

      if (!user) {
        console.log('Creating new user for Firebase UID:', decodedToken.uid);
        user = await storage.createUser({
          firebaseId: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || '',
        });
        console.log('New user created:', { 
          id: user.id, 
          email: user.email,
          firebaseId: user.firebaseId 
        });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error('Firebase token verification failed:', {
        error,
        currentHost,
        isCustomDomain,
        errorCode: error.code,
        errorMessage: error.message,
        path: req.path
      });
      return res.status(401).json({ 
        error: "Authentication failed",
        details: error.message
      });
    }
  });

  // Get current user endpoint
  app.get("/api/user", (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}