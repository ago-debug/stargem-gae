import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

console.log("Variabili caricate, controllo DB_URL:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    console.error("ERRORE CRITICO: DATABASE_URL mancante nel file .env");
    process.exit(1);
}

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function run() {
    try {
        console.log("Connessione al database stabilita. Inizio migrazione STI...");

        // 1. Create `activity_details`
        console.log("Creazione tabella `activity_details`...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS activity_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                sku VARCHAR(100),
                active BOOLEAN DEFAULT TRUE,
                category_id INT,
                instructor_id INT,
                studio_id INT,
                day_of_week VARCHAR(50),
                start_date DATE,
                end_date DATE,
                start_time VARCHAR(5),
                end_time VARCHAR(5),
                price DECIMAL(10, 2),
                max_capacity INT,
                current_enrollment INT DEFAULT 0,
                extra_info JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Tabella `activity_details` pronta.");

        // 2. Create `universal_enrollments`
        console.log("Creazione tabella `universal_enrollments`...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS universal_enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                activity_detail_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                enrollment_date DATE,
                residual_entries INT,
                notes TEXT,
                extra_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Tabella `universal_enrollments` pronta.");

        console.log("Tabelle Schema STI create correttamente.");
        // Non distrugge le vecchie tabelle. Fase 1 completata in sicurezza.

    } catch (error) {
        console.error("Errore durante la creazione delle tabelle STI:");
        console.error(error);
    } finally {
        await pool.end();
        console.log("Connessione al database chiusa. Processo terminato.");
        process.exit(0);
    }
}

run();
