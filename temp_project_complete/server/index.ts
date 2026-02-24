import * as nodeCrypto from "node:crypto";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Ensure crypto is available globally for dependencies that expect browser-like crypto
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = nodeCrypto.webcrypto;
}
// Also ensure crypto module is available for libraries using require('crypto')
if (typeof (globalThis as any).crypto.randomBytes === 'undefined') {
  (globalThis as any).crypto.randomBytes = nodeCrypto.randomBytes;
  (globalThis as any).crypto.createHash = nodeCrypto.createHash;
  (globalThis as any).crypto.createHmac = nodeCrypto.createHmac;
}

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

async function syncDatabase() {
  log("Database sync check initiated...", "database");
  if (process.env.NODE_ENV === "production" || process.env.DB_SYNC === "true" || true) { // Force for now to fix user issue
    log("Verifying and synchronizing database schema...", "database");
    try {
      // Attempt to run drizzle-kit push
      // We try a few ways to find the executable
      const cmd = "npx drizzle-kit push";
      log(`Executing: ${cmd}`, "database");

      const { stdout, stderr } = await execPromise(cmd);
      if (stdout) log("Sync Output: " + stdout, "database");
      if (stderr) log("Sync Signal: " + stderr, "database");
      log("Database schema synchronization successful.", "database");
    } catch (err: any) {
      log("Database sync failed: " + err.message, "database");
      if (err.stderr) log("Sync Error Details: " + err.stderr, "database");
      log("Manual action might be required: run 'npm run db:push' on the server.", "database");
    }
  }
}

(async () => {
  await syncDatabase();
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
