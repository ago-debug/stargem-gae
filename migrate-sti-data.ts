import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

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

const ACTIVITY_TABLES = [
    { name: 'courses', type: 'course' },
    { name: 'workshops', type: 'workshop' },
    { name: 'paid_trials', type: 'paid_trial' },
    { name: 'free_trials', type: 'free_trial' },
    { name: 'single_lessons', type: 'single_lesson' },
    { name: 'sunday_activities', type: 'sunday_activity' },
    { name: 'trainings', type: 'training' },
    { name: 'individual_lessons', type: 'individual_lesson' },
    { name: 'campus_activities', type: 'campus' },
    { name: 'recitals', type: 'recital' },
    { name: 'vacation_studies', type: 'vacation_study' }
];

const ENROLLMENT_TABLES = [
    { name: 'enrollments', refColumn: 'course_id', newType: 'course' },
    { name: 'workshop_enrollments', refColumn: 'workshop_id', newType: 'workshop' },
    { name: 'paid_trial_enrollments', refColumn: 'paid_trial_id', newType: 'paid_trial' },
    { name: 'free_trial_enrollments', refColumn: 'free_trial_id', newType: 'free_trial' },
    { name: 'single_lesson_enrollments', refColumn: 'single_lesson_id', newType: 'single_lesson' },
    { name: 'sunday_activity_enrollments', refColumn: 'sunday_activity_id', newType: 'sunday_activity' },
    { name: 'training_enrollments', refColumn: 'training_id', newType: 'training' },
    { name: 'individual_lesson_enrollments', refColumn: 'individual_lesson_id', newType: 'individual_lesson' },
    { name: 'campus_enrollments', refColumn: 'campus_activity_id', newType: 'campus' },
    { name: 'recital_enrollments', refColumn: 'recital_id', newType: 'recital' },
    { name: 'vacation_study_enrollments', refColumn: 'vacation_study_id', newType: 'vacation_study' }
];

// Mappa per tenere traccia delle conversioni degli ID (old_id -> new_id) per ogni tipo
const idMap: Record<string, Record<number, number>> = {};

async function checkTableExists(tableName: string): Promise<boolean> {
    const [rows] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
    return (rows as any[]).length > 0;
}

async function runMigration() {
    try {
        console.log("Inizio migrazione dati STI...");

        // Svuotiamo le tabelle target per un import pulito
        await pool.query('TRUNCATE TABLE universal_enrollments');
        await pool.query('TRUNCATE TABLE activity_details');
        console.log("Tabelle target svuotate.");

        // 1. MIGRAZIONE ATTIVITA'
        for (const tbl of ACTIVITY_TABLES) {
            idMap[tbl.type] = {};
            const exists = await checkTableExists(tbl.name);
            if (!exists) {
                console.log(`Tabella ${tbl.name} non esiste, salto...`);
                continue;
            }

            console.log(`Migrazione attività da ${tbl.name}...`);
            const [rows] = await pool.query(`SELECT * FROM ${tbl.name}`);
            const records = rows as any[];

            for (const record of records) {
                const [result] = await pool.query(
                    `INSERT INTO activity_details (
                        type, name, description, sku, active, category_id, instructor_id, studio_id, 
                        day_of_week, start_date, end_date, start_time, end_time, price, max_capacity, current_enrollment, extra_info, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tbl.type,
                        record.name || 'Senza Nome',
                        record.description || null,
                        record.sku || null,
                        record.active !== undefined ? record.active : true,
                        record.category_id || null,
                        record.instructor_id || null,
                        record.studio_id || null,
                        record.day_of_week || null,
                        record.start_date || null,
                        record.end_date || null,
                        record.start_time || null,
                        record.end_time || null,
                        record.price || null,
                        record.max_capacity || null,
                        record.current_enrollment || 0,
                        null, // extra_info
                        record.created_at || new Date()
                    ]
                );
                idMap[tbl.type][record.id] = (result as any).insertId;
            }
            console.log(`  -> Migrati ${records.length} record da ${tbl.name}`);
        }

        // 2. MIGRAZIONE ISCRIZIONI
        for (const tbl of ENROLLMENT_TABLES) {
            const exists = await checkTableExists(tbl.name);
            if (!exists) {
                console.log(`Tabella iscrizioni ${tbl.name} non esiste, salto...`);
                continue;
            }

            console.log(`Migrazione iscrizioni da ${tbl.name}...`);
            const [rows] = await pool.query(`SELECT * FROM ${tbl.name}`);
            const records = rows as any[];

            let successCount = 0;
            for (const record of records) {
                const oldTargetId = record[tbl.refColumn];
                const newActivityId = idMap[tbl.newType]?.[oldTargetId];

                if (!newActivityId) {
                    console.warn(`  [!] Iscrizione saltata: attività originaria (ID ${oldTargetId} in ${tbl.newType}) non trovata nella mappa.`);
                    continue;
                }

                await pool.query(
                    `INSERT INTO universal_enrollments (
                        member_id, activity_detail_id, status, enrollment_date, residual_entries, notes, extra_data, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        record.member_id,
                        newActivityId,
                        record.status || 'active',
                        record.enrollment_date || record.created_at || new Date(),
                        record.residual_entries || null,
                        record.notes || null,
                        null, // extra_data
                        record.created_at || new Date()
                    ]
                );
                successCount++;
            }
            console.log(`  -> Migrate ${successCount}/${records.length} iscrizioni da ${tbl.name}`);
        }

        console.log("✅ Migrazione dati STI completata con successo!");

    } catch (error) {
        console.error("Errore fatale durante la migrazione dati:");
        console.error(error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runMigration();
