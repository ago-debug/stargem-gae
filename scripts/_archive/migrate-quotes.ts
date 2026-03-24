
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Migrating Quotes tables...');

    try {
        // 1. Create quotes table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
        console.log('Created quotes table.');

        // 2. Add quote_id to price_list_items if not exists
        try {
            await db.execute(sql`
            ALTER TABLE price_list_items ADD COLUMN quote_id INT NULL;
        `);
            console.log('Added quote_id to price_list_items.');

            await db.execute(sql`
            ALTER TABLE price_list_items ADD CONSTRAINT fk_price_list_items_quote 
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL;
        `);
            console.log('Added FK constraint for quote_id.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('quote_id already exists in price_list_items.');
            } else {
                console.error('Error adding quote_id column:', e);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
