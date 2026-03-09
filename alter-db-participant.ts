import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Creazione tabella participant_types...");
    try {
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS participant_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(50),
        sort_order INT DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Seed default values
        const [existing]: any = await db.execute(sql`SELECT COUNT(*) as count FROM participant_types`);
        if (existing[0].count === 0) {
            console.log("Inserimento valori di default per participant_types...");
            await db.execute(sql`
        INSERT INTO participant_types (name, color, sort_order) VALUES
        ('Tesserato', '#4bc0c0', 1),
        ('Non Tesserato', '#ffcd56', 2),
        ('Prova', '#36a2eb', 3),
        ('Staff/Insegnante', '#ff6384', 4),
        ('Dirigente', '#9966ff', 5),
        ('Socio', '#c9cbcf', 6);
      `);
        }

        console.log("Tabella participant_types creata e popolata ✓");
    } catch (error) {
        console.error("Errore durante la creazione:", error);
    }
    process.exit(0);
}

run();
