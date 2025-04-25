import 'dotenv/config'; // Load environment variables from .env file
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { setupAuth } from "./auth";
import cron from "node-cron";
import { fetchAllTrackedTrades } from "./trade-fetcher";

// Configure CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true, // This is important for cookies/auth to work properly
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const app = express();

// Apply CORS middleware
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session store
const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";

// Configure session middleware
app.use(session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "local-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax', // Allow cross-site cookies in production
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  proxy: isProduction // Trust the reverse proxy if in production
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);

    // Schedule the trade fetcher job
    // Runs every 30 minutes
    const fetchSchedule = '*/30 * * * *';
    log(`Scheduling trade fetcher job with schedule: ${fetchSchedule}`);
    cron.schedule(fetchSchedule, async () => {
      log("Running scheduled trade fetcher job...");
      await fetchAllTrackedTrades();
      log("Scheduled trade fetcher job finished.");
    });

    // Optional: Run once immediately on startup (uncomment if needed)
    
    log("Running initial trade fetch on startup...");
    fetchAllTrackedTrades().then(() => {
      log("Initial trade fetch complete.");
    }).catch(error => {
      log(`Initial trade fetch failed: ${error}`);
    });
    
  });
})();