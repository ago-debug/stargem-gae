
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigration() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    // Parse DB URL
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        console.error('Invalid DATABASE_URL format');
        process.exit(1);
    }

    const [, user, password, host, portStr, database] = match;
    const port = parseInt(portStr, 10);

    console.log(`Connecting to ${host} as ${user}...`);
    const conn = await mysql.createConnection({
        host,
        user,
        password,
        port,
        database: database,
        multipleStatements: true
    });

    const migrationFile = path.resolve(process.cwd(), 'migrations/0000_chief_jack_murdock.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split by breakpoint
    const statements = sql.split('--> statement-breakpoint');

    console.log(`Found ${statements.length} statements to execute.`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;

        try {
            await conn.query(stmt);
            console.log(`✅ Statement ${i + 1} executed.`);
        } catch (err: any) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
                console.log(`⚠️ Statement ${i + 1} skipped (already exists): ${err.message}`);
            } else {
                console.error(`❌ Statement ${i + 1} failed: ${err.message}`);
                // console.error(stmt);
            }
        }
    }

    console.log('Migration application completed.');
    await conn.end();
}

applyMigration();
