
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
    try {
        console.log("Checking for 'price_lists' table...");
        // @ts-ignore
        const [rows1] = await db.execute(sql`SHOW TABLES LIKE 'price_lists'`);
        console.log("price_lists check result:", rows1);

        console.log("Checking for 'price_list_items' table...");
        // @ts-ignore
        const [rows2] = await db.execute(sql`SHOW TABLES LIKE 'price_list_items'`);
        console.log("price_list_items check result:", rows2);

    } catch (error) {
        console.error("Error checking tables:", error);
    } finally {
        process.exit(0);
    }
}

checkTables();
