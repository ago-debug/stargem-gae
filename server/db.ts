import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let poolConfig: any;
const uriMatch = process.env.DATABASE_URL.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
if (uriMatch) {
  poolConfig = {
    user: decodeURIComponent(uriMatch[1]),
    password: decodeURIComponent(uriMatch[2]),
    host: uriMatch[3],
    port: parseInt(uriMatch[4], 10),
    database: uriMatch[5],
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
} else {
  poolConfig = {
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

// Create the connection pool
export const pool = mysql.createPool(poolConfig);

export const db = drizzle(pool, { schema, mode: 'default' });
