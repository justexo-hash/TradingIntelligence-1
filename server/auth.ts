import { Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  // Check session
  app.get("/api/auth/session", (req: any, res) => {
    if (!req.session?.user) {
      return res.json({ user: null });
    }
    res.json({ user: req.session.user });
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const sessionUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      req.session.user = sessionUser;
      res.json({ user: sessionUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      const exists = await storage.getUserByEmail(email);
      if (exists) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        passwordHash,
        displayName: email.split('@')[0],
      });

      const sessionUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };

      req.session.user = sessionUser;
      res.json({ user: sessionUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Auth middleware for API routes
  app.use("/api", (req: any, res: any, next: any) => {
    // Allow development mode bypass
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    if (!req.session?.user) {
      return res.status(401).json({ 
        error: "Authentication required",
        details: "Please sign in to access this resource"
      });
    }

    req.user = req.session.user;
    next();
  });

  // Get current user endpoint
  app.get("/api/user", (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
}