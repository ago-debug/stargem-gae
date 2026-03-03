import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./shared/schema";

async function verify() {
    const url = process.env.DATABASE_URL;
    if (!url) return;
    const poolConnection = mysql.createPool(url);
    const db = drizzle(poolConnection, { schema, mode: "default" });

    try {
        const stats = {
            members: await db.select().from(schema.members).limit(1),
            courses: await db.select().from(schema.courses).limit(1),
            memberships: await db.select().from(schema.memberships).limit(1),
            payments: await db.select().from(schema.payments).limit(1),
            medicalCerts: await db.select().from(schema.medicalCertificates).limit(1),
            enrollments: await db.select().from(schema.enrollments).limit(1),
        };

        console.log("SUCCESS. All dashboard-related tables queried successfully.");
        console.log("Payments found:", stats.payments.length);
    } catch (err: any) {
        console.error("FAILED querying one of the tables:", err);
    } finally {
        poolConnection.end();
    }
}

verify();
