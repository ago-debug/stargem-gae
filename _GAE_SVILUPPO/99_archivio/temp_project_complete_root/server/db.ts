import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

// Database configuration from environment variables
const host = process.env.DB_HOST || "corsi.abreve.it";
const user = process.env.DB_USER || "admincourse";
const password = process.env.DB_PASSWORD || "L#oa8t6d&n9zgKjO";
const database = process.env.DB_NAME || "course";

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    multipleStatements: true,
});

export const db = drizzle(pool, { schema, mode: "default" });
