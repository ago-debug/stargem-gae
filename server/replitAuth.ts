import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export const isExternalDeploy = !process.env.REPLIT_DOMAINS;

// Dynamic imports for openid-client (only loaded when needed)
let oidcClient: typeof import("openid-client") | null = null;
let oidcConfig: any = null;

async function getOidcClient() {
  if (!oidcClient && !isExternalDeploy) {
    oidcClient = await import("openid-client");
  }
  return oidcClient;
}

async function getOidcConfig() {
  if (isExternalDeploy) return null;
  if (oidcConfig) return oidcConfig;
  
  const client = await getOidcClient();
  if (!client) return null;
  
  oidcConfig = await client.discovery(
    new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
    process.env.REPL_ID!
  );
  return oidcConfig;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: any) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (isExternalDeploy) {
    // External deploy: simplified auth bypass
    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    app.post("/api/login", async (req, res) => {
      res.json({ success: true });
    });

    app.get("/api/login", (req, res) => {
      res.redirect("/");
    });

    app.get("/api/logout", (req, res) => {
      res.redirect("/");
    });

    return;
  }

  // Replit Auth setup - only loaded when not external deploy
  const client = await getOidcClient();
  const config = await getOidcConfig();
  
  if (!client || !config) {
    console.error("Failed to load OIDC configuration");
    return;
  }

  const { Strategy } = await import("openid-client/passport");

  const verify = async (tokens: any, verified: passport.AuthenticateCallback) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", async (req, res) => {
    const client = await getOidcClient();
    const config = await getOidcConfig();
    req.logout(() => {
      if (client && config) {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } else {
        res.redirect("/");
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Bypass authentication completely for external deployments
  if (isExternalDeploy) {
    const mockClaims = {
      sub: "external-user",
      email: "user@external",
      first_name: "External",
      last_name: "User",
    };
    (req as any).user = {
      claims: mockClaims,
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 365,
    };
    await upsertUser(mockClaims);
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const client = await getOidcClient();
    const config = await getOidcConfig();
    if (!client || !config) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
