import "dotenv/config";
import mysql from "mysql2/promise";

async function runMigration() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("Missing DATABASE_URL");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const conn = await mysql.createConnection(url);

    try {
        console.log("Starting migration for 9 new enrollment tables...");

        const tables = [
            { name: "pt_enrollments", fk: "paid_trial_id", refTable: "paid_trials" },
            { name: "ft_enrollments", fk: "free_trial_id", refTable: "free_trials" },
            { name: "sl_enrollments", fk: "single_lesson_id", refTable: "single_lessons" },
            { name: "sa_enrollments", fk: "sunday_activity_id", refTable: "sunday_activities" },
            { name: "tr_enrollments", fk: "training_id", refTable: "trainings" },
            { name: "il_enrollments", fk: "individual_lesson_id", refTable: "individual_lessons" },
            { name: "ca_enrollments", fk: "campus_activity_id", refTable: "campus_activities" },
            { name: "rec_enrollments", fk: "recital_id", refTable: "recitals" },
            { name: "vs_enrollments", fk: "vacation_study_id", refTable: "vacation_studies" },
        ];

        for (const t of tables) {
            console.log(`Creating table ${t.name}...`);
            await conn.query(`
        CREATE TABLE IF NOT EXISTS \`${t.name}\` (
          \`id\` int AUTO_INCREMENT PRIMARY KEY,
          \`member_id\` int NOT NULL,
          \`${t.fk}\` int NOT NULL,
          \`status\` varchar(50) NOT NULL DEFAULT 'active',
          \`enrollment_date\` timestamp DEFAULT CURRENT_TIMESTAMP,
          \`notes\` text,
          \`season_id\` int,
          \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`${t.name}_member_id_fk\` FOREIGN KEY (\`member_id\`) REFERENCES \`members\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`${t.name}_${t.fk}_fk\` FOREIGN KEY (\`${t.fk}\`) REFERENCES \`${t.refTable}\`(\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`${t.name}_season_id_fk\` FOREIGN KEY (\`season_id\`) REFERENCES \`seasons\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
        }

        console.log("Updating payments table with new foreign keys...");

        // Ignore errors if columns already exist
        for (const t of tables) {
            const colName = t.name.replace("enrollments", "enroll_id");
            try {
                await conn.query(`ALTER TABLE \`payments\` ADD COLUMN \`${colName}\` int;`);
                console.log(`Added column ${colName} to payments.`);
            } catch (e: any) {
                if (e.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`Error adding ${colName}:`, e.message);
                }
            }

            try {
                await conn.query(`
          ALTER TABLE \`payments\` 
          ADD CONSTRAINT \`payments_${colName}_fk\` 
          FOREIGN KEY (\`${colName}\`) REFERENCES \`${t.name}\`(\`id\`) ON DELETE CASCADE;
        `);
                console.log(`Added foreign key for ${colName} on payments.`);
            } catch (e: any) {
                if (!e.message.includes("Duplicate foreign key")) {
                    console.error(`Error adding FK for ${colName}:`, e.message);
                }
            }
        }

        console.log("All extra enrollment migrations completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await conn.end();
        console.log("Database connection closed.");
    }
}

runMigration();
