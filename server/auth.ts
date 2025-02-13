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
      clientEmail: `${process.env.VITE_FIREBASE_PROJECT_ID}@appspot.gserviceaccount.com`,
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
    console.log('Auth middleware - Headers:', req.headers);
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No token provided in request headers');
      if (process.env.NODE_ENV === 'development') {
        // In development, allow requests without authentication for testing
        console.log('Development mode: Allowing request without authentication');
        next();
        return;
      }
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      console.log('Verifying token...');
      const decodedToken = await getAuth().verifyIdToken(token);
      console.log('Token verified successfully for user:', decodedToken.uid);

      // Get or create user in our database
      let user = await storage.getUserByFirebaseId(decodedToken.uid);
      console.log('Existing user found:', user);

      if (!user) {
        console.log('Creating new user for Firebase UID:', decodedToken.uid);
        user = await storage.createUser({
          firebaseId: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || '',
        });
        console.log('New user created:', user);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      return res.status(401).json({ error: "Invalid token" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", async (req: any, res: any) => {
    console.log('GET /api/user - Current user:', req.user);
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('POST /api/register - Request body:', req.body);
      const existingUser = await storage.getUserByFirebaseId(req.body.firebaseId);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
      });

      console.log('New user registered:', user);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error in /api/register:', error);
      next(error);
    }
  });
}