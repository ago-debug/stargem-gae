
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkTables() {
    try {
        console.log("Checking tables...");
        const [result] = await db.execute(sql`SHOW TABLES LIKE 'booking_services'`);
        console.log("Table booking_services status:", result);

        const [categoriesResult] = await db.execute(sql`SHOW TABLES LIKE 'booking_service_categories'`);
        console.log("Table booking_service_categories status:", categoriesResult);

        if (Object.keys(result).length === 0) {
            console.log("Table 'booking_services' is MISSING!");
        } else {
            console.log("Table 'booking_services' exists.");
            const [columns] = await db.execute(sql`DESCRIBE booking_services`);
            console.log("Columns in booking_services:", columns);
        }
    } catch (error) {
        console.error("Error checking tables:", error);
    } finally {
        process.exit(0);
    }
}

checkTables();
