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

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is missing');
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_CLIENT_EMAIL environment variable is missing');
  }

  if (!process.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('VITE_FIREBASE_PROJECT_ID environment variable is missing');
  }

  // Ensure proper formatting of private key by:
  // 1. Replacing escaped newlines with actual newlines
  // 2. Removing any extra quotes that might have been added
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(/^["']|["']$/g, '');

  const adminConfig = {
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  };

  console.log('Attempting to initialize Firebase Admin with config:', {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKeyLength: privateKey.length,
    hasValidPrivateKey: privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')
  });

  initializeApp(adminConfig);
  console.log('Firebase Admin initialized successfully');
} catch (error: any) {
  console.error('Error initializing Firebase Admin:', {
    error: error.message,
    stack: error.stack,
    code: error.code,
  });
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
        try {
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
        } catch (error) {
          console.error('Error setting up mock user:', error);
          return res.status(500).json({ 
            error: "Internal server error",
            details: "Error setting up development environment"
          });
        }
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

      const decodedToken = await getAuth().verifyIdToken(token, true);
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
        try {
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
        } catch (error) {
          console.error('Error creating new user:', error);
          return res.status(500).json({ 
            error: "Internal server error",
            details: "Error creating user account"
          });
        }
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

      let statusCode = 401;
      let errorMessage = "Authentication failed";

      if (error.code === 'auth/id-token-expired') {
        errorMessage = "Authentication token has expired. Please sign in again.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please sign in again.";
      }

      return res.status(statusCode).json({ 
        error: errorMessage,
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