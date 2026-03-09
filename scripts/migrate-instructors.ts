import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL must be set");
    }

    const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
    });

    const db = drizzle(pool, { schema, mode: 'default' });

    console.log("Disable formatting checks...");
    await db.execute(sql`SET FOREIGN_KEY_CHECKS=0`);

    try {
        // 1. Fetch all instructors
        const allInstructors = await db.select().from(schema.instructors);
        console.log(`Found ${allInstructors.length} instructors to migrate.`);

        const idMap: Record<number, number> = {};

        for (const inst of allInstructors) {
            // 2. Insert into members
            const [result] = await db.insert(schema.members).values({
                firstName: inst.firstName,
                lastName: inst.lastName,
                email: inst.email,
                phone: inst.phone,
                notes: inst.bio ? `Specialization: ${inst.specialization || 'N/A'}\nBio: ${inst.bio}` : inst.specialization,
                participantType: "INSEGNANTE",
                active: inst.active,
                createdAt: inst.createdAt || new Date(),
                updatedAt: inst.updatedAt || new Date(),
            });

            const newMemberId = result.insertId;
            idMap[inst.id] = newMemberId;
            console.log(`Migrated Instructor ${inst.id} -> Member ${newMemberId}`);
        }

        // 3. Update all related tables
        const tablesToUpdate = [
            "courses", "workshops", "paid_trials", "free_trials",
            "single_lessons", "sunday_activities", "trainings",
            "individual_lessons", "campus_activities", "recitals",
            "vacation_studies"
        ];

        for (const [oldIdStr, newId] of Object.entries(idMap)) {
            const oldId = parseInt(oldIdStr);

            for (const table of tablesToUpdate) {
                // Warning: sql.raw is used here for table names
                await db.execute(sql`UPDATE \`${sql.raw(table)}\` SET instructor_id = ${newId} WHERE instructor_id = ${oldId}`);
                await db.execute(sql`UPDATE \`${sql.raw(table)}\` SET secondary_instructor1_id = ${newId} WHERE secondary_instructor1_id = ${oldId}`);
            }

            // Update instructorRates Table
            await db.execute(sql`UPDATE instr_rates SET instructor_id = ${newId} WHERE instructor_id = ${oldId}`);
        }

        console.log("Successfully updated foreign keys in all activity tables and rates.");

        // Delete all from instructors to ensure no orphaned data (Drizzle push will drop the table)
        await db.execute(sql`DELETE FROM instructors`);
        console.log("Cleared old instructors data.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await db.execute(sql`SET FOREIGN_KEY_CHECKS=1`);
        pool.end();
        console.log("Migration script finished.");
    }
}

main().catch(console.error);
