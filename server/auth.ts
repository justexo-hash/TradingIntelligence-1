import { auth as adminAuth } from "firebase-admin";
import { Express } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { storage } from "./storage";

// Initialize Firebase Admin with service account
try {
  const isProduction = process.env.CUSTOM_DOMAIN === 'true';
  console.log('Initializing Firebase Admin:', {
    isProduction,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    customDomain: isProduction ? 'trademate.live' : undefined
  });

  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
    const isProduction = req.headers.host === 'trademate.live';

    console.log('Auth middleware check:', {
      host: req.headers.host,
      isProduction,
      hasAuth: !!req.headers.authorization,
      customDomain: isProduction ? 'trademate.live' : undefined
    });

    const authHeader = req.headers.authorization;

    // Only allow development mode bypass on non-production
    if (!authHeader?.startsWith('Bearer ')) {
      if (!isProduction) {
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
        host: req.headers.host,
        isProduction,
        tokenLength: token.length,
        customDomain: isProduction ? 'trademate.live' : undefined
      });

      const decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        host: req.headers.host,
        isProduction
      });

      let user = await storage.getUserByFirebaseId(decodedToken.uid);
      console.log('Database user lookup result:', user ? 'Found' : 'Not found');

      if (!user) {
        console.log('Creating new user for Firebase UID:', decodedToken.uid);
        user = await storage.createUser({
          firebaseId: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decoded.picture || '',
        });
        console.log('New user created:', { id: user.id, email: user.email });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error('Firebase token verification failed:', {
        error,
        host: req.headers.host,
        isProduction,
        errorCode: error.code,
        errorMessage: error.message,
        customDomain: isProduction ? 'trademate.live' : undefined
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