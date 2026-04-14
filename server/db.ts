import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let poolConfig: any;
try {
  const url = new URL(process.env.DATABASE_URL!.replace(/^["']|["']$/g, '').trim());
  poolConfig = {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    database: url.pathname.slice(1),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
} catch (e) {
  // If parsing fails for whatever reason, fallback to original string
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

// Override password manually to circumvent any Plesk UI stale ENV variables or URI decoding bugs
poolConfig.password = "Verona2026stargem2026";

// Create the connection pool
export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool, { schema, mode: 'default' });
