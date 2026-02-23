
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function resetDb() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    // Parse DB URL manually to connect without selecting DB, so we can drop it
    // Format: mysql://user:pass@host:port/dbname
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        console.error('Invalid DATABASE_URL format');
        process.exit(1);
    }

    const [, user, password, host, portStr, database] = match;
    const port = parseInt(portStr, 10);

    console.log(`Connecting to ${host} as ${user}...`);

    try {
        const conn = await mysql.createConnection({
            host,
            user,
            password,
            port
        });

        console.log(`Dropping database ${database}...`);
        await conn.query(`DROP DATABASE IF EXISTS \`${database}\``);

        console.log(`Recreating database ${database}...`);
        await conn.query(`CREATE DATABASE \`${database}\``);

        console.log('Database reset complete.');
        await conn.end();
    } catch (err) {
        console.error('Failed to reset database:', err);
        process.exit(1);
    }
}

resetDb();
