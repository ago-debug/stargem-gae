import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function syncSchema() {
    console.log("Adding new columns to 'members' table...");

    const memberColumns = [
        "ADD COLUMN mother_birth_date DATE",
        "ADD COLUMN mother_birth_place VARCHAR(255)",
        "ADD COLUMN mother_birth_province VARCHAR(2)",
        "ADD COLUMN mother_street_address VARCHAR(255)",
        "ADD COLUMN mother_city VARCHAR(100)",
        "ADD COLUMN mother_province VARCHAR(2)",
        "ADD COLUMN mother_postal_code VARCHAR(10)",
        "ADD COLUMN father_birth_date DATE",
        "ADD COLUMN father_birth_place VARCHAR(255)",
        "ADD COLUMN father_birth_province VARCHAR(2)",
        "ADD COLUMN father_street_address VARCHAR(255)",
        "ADD COLUMN father_city VARCHAR(100)",
        "ADD COLUMN father_province VARCHAR(2)",
        "ADD COLUMN father_postal_code VARCHAR(10)",
        "ADD COLUMN season VARCHAR(50)",
        "ADD COLUMN internal_id VARCHAR(50)",
        "ADD COLUMN insertion_date DATE",
        "ADD COLUMN participant_type VARCHAR(50)",
        "ADD COLUMN from_where VARCHAR(255)",
        "ADD COLUMN team_segreteria VARCHAR(255)",
        "ADD COLUMN detraction_requested BOOLEAN DEFAULT FALSE",
        "ADD COLUMN detraction_year VARCHAR(4)",
        "ADD COLUMN credits_requested BOOLEAN DEFAULT FALSE",
        "ADD COLUMN credits_year VARCHAR(20)",
        "ADD COLUMN tesserino_tecnico_number VARCHAR(100)",
        "ADD COLUMN tesserino_tecnico_date DATE"
    ];

    for (const col of memberColumns) {
        try {
            await db.execute(sql.raw(`ALTER TABLE members ${col}`));
            console.log(`Success: ${col}`);
        } catch (e: any) {
            if (e.message.includes("Duplicate column name")) {
                console.log(`Skipped (already exists): ${col}`);
            } else {
                console.error(`Error adding column: ${col}`, e.message);
            }
        }
    }

    console.log("\nAdding new columns to 'payments' table...");
    const paymentColumns = [
        "ADD COLUMN quantity INT DEFAULT 1",
        "ADD COLUMN quota_description VARCHAR(255)",
        "ADD COLUMN period VARCHAR(255)",
        "ADD COLUMN total_quota DECIMAL(10, 2)",
        "ADD COLUMN discount_code VARCHAR(100)",
        "ADD COLUMN discount_value DECIMAL(10, 2)",
        "ADD COLUMN discount_percentage DECIMAL(5, 2)",
        "ADD COLUMN promo_code VARCHAR(100)",
        "ADD COLUMN promo_value DECIMAL(10, 2)",
        "ADD COLUMN promo_percentage DECIMAL(5, 2)",
        "ADD COLUMN deposit DECIMAL(10, 2)",
        "ADD COLUMN annual_balance DECIMAL(10, 2)",
        "ADD COLUMN receipts_count INT",
        "ADD COLUMN transfer_confirmation_date DATE"
    ];

    for (const col of paymentColumns) {
        try {
            await db.execute(sql.raw(`ALTER TABLE payments ${col}`));
            console.log(`Success: ${col}`);
        } catch (e: any) {
            if (e.message.includes("Duplicate column name")) {
                console.log(`Skipped (already exists): ${col}`);
            } else {
                console.error(`Error adding column: ${col}`, e.message);
            }
        }
    }

    console.log("\nSchema sync completed.");
    process.exit(0);
}

syncSchema().catch(err => {
    console.error("Schema sync failed:", err);
    process.exit(1);
});
