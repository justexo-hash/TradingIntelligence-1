import { auth as adminAuth } from "firebase-admin";
import { Express } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { storage } from "./storage";

// Initialize Firebase Admin with service account
try {
  const isProd = process.env.NODE_ENV === 'production' || process.env.PROD === 'true';
  console.log('Initializing Firebase Admin:', {
    environment: isProd ? 'production' : 'development',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });

  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || `${process.env.VITE_FIREBASE_PROJECT_ID}@appspot.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export function setupAuth(app: Express) {
  // Authentication middleware for API routes
  app.use(async (req: any, res: any, next: any) => {
    const isProd = process.env.NODE_ENV === 'production' || process.env.PROD === 'true';
    const isCustomDomain = req.headers.host === 'trademate.live';

    console.log('Auth middleware check:', {
      NODE_ENV: process.env.NODE_ENV,
      PROD: process.env.PROD,
      isProd,
      host: req.headers.host,
      isCustomDomain,
      hasAuth: !!req.headers.authorization
    });

    const authHeader = req.headers.authorization;

    // Only allow development mode bypass on non-production
    if (!authHeader?.startsWith('Bearer ')) {
      if (!isProd) {
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

      return res.status(401).json({ 
        error: "No authentication token provided",
        details: "Please sign in to access this resource"
      });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      console.log('Verifying Firebase token:', {
        environment: isProd ? 'production' : 'development',
        host: req.headers.host,
        isCustomDomain,
        tokenLength: token.length
      });

      const decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        environment: isProd ? 'production' : 'development',
        host: req.headers.host
      });

      let user = await storage.getUserByFirebaseId(decodedToken.uid);
      console.log('Database user lookup result:', user ? 'Found' : 'Not found');

      if (!user) {
        console.log('Creating new user for Firebase UID:', decodedToken.uid);
        user = await storage.createUser({
          firebaseId: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || '',
        });
        console.log('New user created:', { id: user.id, email: user.email });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error('Firebase token verification failed:', {
        error,
        host: req.headers.host,
        isCustomDomain
      });
      return res.status(401).json({ 
        error: "Authentication failed",
        details: error.message
      });
    }
  });

  // Get current user endpoint
  app.get("/api/user", async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}