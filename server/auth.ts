import { Express, Request } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "./storage";
import { SessionData } from "express-session";

// Extend the session interface to include user property
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      displayName: string;
      photoURL?: string | null;
    };
  }
}

// In-memory token store (should be replaced with database storage in production)
const resetTokens = new Map<string, { email: string; expires: Date }>();

export function setupAuth(app: Express) {
  // Check session
  app.get("/api/auth/session", (req: any, res) => {
    if (!req.session?.user) {
      return res.json({ user: null });
    }
    res.json({ user: req.session.user });
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res) => {
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

      if (req.session) {
        req.session.user = sessionUser;
      }
      res.json({ user: sessionUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Register
  app.post("/api/auth/register", async (req: Request, res) => {
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

      if (req.session) {
        req.session.user = sessionUser;
      }
      res.json({ user: sessionUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return res.json({ message: "If an account exists with that email, a password reset link will be sent." });
      }

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour expiry

      // Store the token (in production, this should be in the database)
      resetTokens.set(token, { email, expires });

      // In a production environment, send an email with the reset link
      // For development, just log it
      console.log(`Password reset token for ${email}: ${token}`);

      res.json({ message: "Password reset instructions sent" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const resetData = resetTokens.get(token);

      if (!resetData || resetData.expires < new Date()) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      const user = await storage.getUserByEmail(resetData.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, passwordHash);

      // Clean up the used token
      resetTokens.delete(token);

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
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
    // Skip auth check for session endpoint and auth-related endpoints
    if (req.path === '/auth/session' || 
        req.path === '/auth/login' || 
        req.path === '/auth/register' || 
        req.path === '/auth/forgot-password' || 
        req.path === '/auth/reset-password' ||
        req.path === '/shared-trades') {
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