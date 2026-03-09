import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL must be set");
    }

    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    try {
        const [rows]: any = await db.execute(sql`
      SELECT CONSTRAINT_NAME, TABLE_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'instructors' AND TABLE_SCHEMA = DATABASE();
    `);

        for (const row of rows) {
            console.log(`Dropping FK ${row.CONSTRAINT_NAME} from ${row.TABLE_NAME}`);
            await db.execute(sql.raw(`ALTER TABLE ${row.TABLE_NAME} DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`));
        }

        console.log("Dropping instructors table...");
        await db.execute(sql`DROP TABLE IF EXISTS instructors`);
        console.log("Successfully dropped instructors and its FKs!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        pool.end();
    }
}

main().catch(console.error);
