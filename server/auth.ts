import { auth as adminAuth } from "firebase-admin";
import { Express } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { storage } from "./storage";

// Initialize Firebase Admin with service account
try {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is missing');
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error('FIREBASE_CLIENT_EMAIL environment variable is missing');
  }

  if (!process.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error('VITE_FIREBASE_PROJECT_ID environment variable is missing');
  }

  // Ensure proper formatting of private key
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

  initializeApp(adminConfig);
  console.log('Firebase Admin initialized successfully');
} catch (error: any) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

export function setupAuth(app: Express) {
  // Authentication middleware for API routes
  app.use(async (req: any, res: any, next: any) => {
    // Only bypass auth in development
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      if (process.env.NODE_ENV !== 'production') {
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
          return res.status(500).json({ error: "Internal server error" });
        }
      }

      return res.status(401).json({ 
        error: "No authentication token provided",
        details: "Please sign in to access this resource"
      });
    }

    try {
      const token = req.headers.authorization.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);

      let user = await storage.getUserByFirebaseId(decodedToken.uid);

      if (!user) {
        user = await storage.createUser({
          firebaseId: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || '',
        });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error('Firebase token verification failed:', error);
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