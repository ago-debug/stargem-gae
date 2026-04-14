import "dotenv/config";
import * as nodeCrypto from "node:crypto";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';

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
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// GLOBAL DEBUG LOG
app.use((req, res, next) => {
  const msg = `[${new Date().toISOString()}] PID:${process.pid} ${req.method} ${req.url}\n`;
  try {
    // DEBUG_ALL_REQUESTS disabled
  } catch (e) {
    console.error("Failed to write global debug log", e);
  }
  next();
});

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Errore di Sistema Interno";

    // Log unexpected errors
    if (status === 500) {
      console.error("GLOBAL ERROR HANDLER CAUGHT:", err);
      try {
        // DEBUG_GLOBAL_ERROR disabled
      } catch (e) { }
    } else {
       console.error(`[API Error ${status}]:`, err.message);
    }

    res.status(status).json({ message, details: err.message });
    // throw err; // RIMOSSO: Prevenzione crash Node.js
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "::",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
