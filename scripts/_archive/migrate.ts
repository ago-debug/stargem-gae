import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL");
        process.exit(1);
    }
    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
    });

    try {
        console.log("Adding created_by and updated_by to members table...");
        await pool.query("ALTER TABLE members ADD COLUMN created_by VARCHAR(255)");
        await pool.query("ALTER TABLE members ADD COLUMN updated_by VARCHAR(255)");
        console.log("Columns added successfully.");
    } catch (err: any) {
        if (err.code === "ER_DUP_FIELDNAME") {
            console.log("Columns already exist.");
        } else {
            console.error("Migration failed:", err);
        }
    } finally {
        await pool.end();
    }
}

run();
