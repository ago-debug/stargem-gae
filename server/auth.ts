import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as DbUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
    namespace Express {
        interface User extends DbUser {
            permissions?: any;
        }
    }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

export async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Check at runtime, not at bundle time (always true for local)
export function isExternalDeploy(): boolean {
    return true;
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send("Not logged in");
}

export function setupAuth(app: Express) {
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "default_local_secret",
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
        cookie: {
            httpOnly: true,
            secure: false, // Changed to false to allow testing on http://localhost:5001
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        },
    };

    app.set("trust proxy", 1);
    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user || !(await comparePasswords(password, user.password))) {
                    return done(null, false);
                } else {
                    return done(null, user);
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => done(null, (user as Express.User).id));
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            if (user) {
                // Try case-insensitive role search or find by exactly matching user.role
                let role = await storage.getUserRoleByName(user.role);
                if (!role) {
                    // Fallback to searching all roles case-insensitively
                    const allRoles = await storage.getUserRoles();
                    role = allRoles.find(r => r.name.toLowerCase() === user.role.toLowerCase());
                }

                let permissions = role?.permissions || {};
                if (typeof permissions === 'string') {
                    try {
                        permissions = JSON.parse(permissions);
                    } catch (e) {
                        permissions = {};
                    }
                }

                // Safety: if user is admin string or role has wildcard, ensure they have full access
                const roleNameLower = user.role.toLowerCase();
                if (roleNameLower === 'admin' || roleNameLower === 'admministratore totale' || (permissions as any)["*"] === "write") {
                    permissions = { "*": "write", ...((permissions as any) || {}) };
                }

                (user as any).permissions = permissions;
            }
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    app.post("/api/login", passport.authenticate("local"), async (req, res) => {
        if (req.user) {
            await storage.logActivity({
                userId: (req.user as any).id,
                action: "LOGIN",
                ipAddress: req.ip || null,
                details: { username: (req.user as any).username }
            });
        }
        res.status(200).json(req.user);
    });

    app.post("/api/logout", (req, res, next) => {
        const user = req.user as any;
        req.logout(async (err) => {
            if (err) return next(err);
            if (user) {
                await storage.logActivity({
                    userId: user.id,
                    action: "LOGOUT",
                    ipAddress: req.ip || null,
                    details: { username: user.username }
                });
            }
            res.sendStatus(200);
        });
    });

    app.get("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            res.redirect("/");
        });
    });

    app.post("/api/register", async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).send("Username e password obbligatori");
            }

            const existingUser = await storage.getUserByUsername(username);
            if (existingUser) {
                return res.status(400).send("Utente già esistente");
            }

            const hashedPassword = await hashPassword(password);
            const user = await storage.upsertUser({
                username,
                password: hashedPassword,
            } as any);

            req.login(user, async (err) => {
                if (err) return res.status(500).send("Errore durante il login automatico");
                await storage.logActivity({
                    userId: user.id,
                    action: "REGISTER",
                    ipAddress: req.ip || null,
                    details: { username: user.username }
                });
                res.status(201).json(user);
            });
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    });

    app.get("/api/user", (req, res) => {
        if (req.isAuthenticated()) {
            res.json(req.user);
        } else {
            res.status(401).send("Not logged in");
        }
    });

    // Seed default admin if no users exist
    (async () => {
        try {
            // Wait a bit for DB to be ready
            setTimeout(async () => {
                try {
                    const existingUser = await storage.getUserByUsername("admin");
                    if (!existingUser) {
                        const hashedPassword = await hashPassword("Ducati1015_");

                        // Seed admin role
                        let adminRole = await storage.getUserRoleByName("admin");
                        if (!adminRole) {
                            adminRole = await storage.createUserRole({
                                name: "admin",
                                description: "Amministratore con accesso completo",
                                permissions: { "*": "write" }
                            });
                        }

                        // Seed operator role
                        const operatorRole = await storage.getUserRoleByName("operator");
                        if (!operatorRole) {
                            await storage.createUserRole({
                                name: "operator",
                                description: "Operatore base",
                                permissions: {
                                    "/": "write",
                                    "/anagrafica_a_lista": "write",
                                    "/corsi": "write",
                                    "/pagamenti": "write",
                                    "/dashboard": "read"
                                }
                            });
                        }

                        await storage.upsertUser({
                            id: "admin-id",
                            username: "admin",
                            password: hashedPassword,
                            role: "admin",
                        } as any);
                        console.log("Default admin and roles created: admin / admin123");
                    }
                } catch (e) {
                    // This might happen if tables are not yet ready
                    console.log("Seeding skipped: Database might not be ready yet.");
                }
            }, 5000);
        } catch (err) {
            console.error("Error seeding admin wrapper:", err);
        }
    })();
}
