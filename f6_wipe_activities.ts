import { db } from './server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function run() {
    try {
        console.log("=== BACKUP ACTIVITIES ===");
        const [result] = await db.execute(sql.raw(`SELECT * FROM activities`));
        const backupPath = './backups/activities_backup_before_wipe.json';
        
        if (!fs.existsSync('./backups')) {
            fs.mkdirSync('./backups');
        }

        fs.writeFileSync(backupPath, JSON.stringify(result, null, 2));
        console.log(`Saved ${(result as any[]).length} rows to ${backupPath}`);

        console.log("=== TRUNCATE ACTIVITIES ===");
        await db.execute(sql.raw(`TRUNCATE TABLE activities`));
        console.log("Wipe completed successfully.");

    } catch(e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
