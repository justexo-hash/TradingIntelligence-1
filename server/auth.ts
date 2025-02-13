import { auth as adminAuth } from "firebase-admin";
import { Express } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, cert } from "firebase-admin/app";
import { storage } from "./storage";

// Initialize Firebase Admin with service account
try {
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || `${process.env.VITE_FIREBASE_PROJECT_ID}@appspot.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized successfully with project:', process.env.VITE_FIREBASE_PROJECT_ID);
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export function setupAuth(app: Express) {
  // Authentication middleware for API routes
  app.use(async (req: any, res: any, next: any) => {
    console.log('Auth middleware - Request origin:', req.headers.origin);
    console.log('Auth middleware - Headers:', {
      authorization: !!req.headers.authorization,
      host: req.headers.host,
      origin: req.headers.origin
    });

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No token provided in request headers');
      // Only use mock user in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Creating mock user');
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
      return res.status(401).json({ error: "No authentication token provided" });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      console.log('Verifying Firebase token...');
      const decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });

      // Get or create user in our database
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
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ 
        error: "Invalid authentication token",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Get current user endpoint
  app.get("/api/user", async (req: any, res: any) => {
    console.log('GET /api/user - Current user:', req.user ? { id: req.user.id, email: req.user.email } : 'None');
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}