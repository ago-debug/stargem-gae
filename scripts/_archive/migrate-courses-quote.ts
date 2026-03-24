
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}

async function main() {
    console.log('Running migration: adding quote_id to courses...');

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        await connection.execute(`
      ALTER TABLE courses
      ADD COLUMN quote_id INT DEFAULT NULL,
      ADD CONSTRAINT fk_courses_quotes
      FOREIGN KEY (quote_id) REFERENCES quotes(id)
      ON DELETE SET NULL;
    `);

        console.log('Migration completed successfully');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, skipping...');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    } finally {
        await connection.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
