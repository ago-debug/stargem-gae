import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("=== STEP 2: Pulizia duplicati ===");
        const [preCheck] = await db.execute(sql.raw(`SELECT id, title, start_date, season_id FROM strategic_events WHERE title LIKE '%Lavoratori%' ORDER BY id`));
        console.log("Prima", preCheck);

        await db.execute(sql.raw(`DELETE FROM strategic_events WHERE id IN (28, 29)`));
        
        const [postCheck] = await db.execute(sql.raw(`SELECT id, title, start_date FROM strategic_events WHERE title LIKE '%Lavoratori%'`));
        console.log("Dopo", postCheck);

        console.log("=== STEP 3: ALTER TABLE ===");
        // Try to add column, ignore if exists
        try {
            await db.execute(sql.raw(`ALTER TABLE strategic_events ADD COLUMN is_public_holiday TINYINT(1) NOT NULL DEFAULT 0 AFTER color`));
            console.log("Column is_public_holiday added.");
        } catch(e: any) {
             console.log("Column might already exist? ", e.message);
        }

        await db.execute(sql.raw(`UPDATE strategic_events SET is_public_holiday = 1 WHERE title LIKE '%Lavoratori%'`));

        console.log("=== STEP 4: INSERT Festività ===");
        
        const season1 = `
        INSERT INTO strategic_events 
        (title, event_type, start_date, end_date, affects_calendar, affects_planning, season_id, color, all_day, is_public_holiday) 
        VALUES 
        ('Tutti i Santi',             'festivita','2025-11-01','2025-11-01',1,1,1,'#DC2626',1,1),
        ('Immacolata Concezione',     'festivita','2025-12-08','2025-12-08',1,1,1,'#DC2626',1,1),
        ('Natale',                    'festivita','2025-12-25','2025-12-25',1,1,1,'#DC2626',1,1),
        ('Santo Stefano',             'festivita','2025-12-26','2025-12-26',1,1,1,'#DC2626',1,1),
        ('Capodanno',                 'festivita','2026-01-01','2026-01-01',1,1,1,'#DC2626',1,1),
        ('Epifania',                  'festivita','2026-01-06','2026-01-06',1,1,1,'#DC2626',1,1),
        ('Martedì Grasso',            'festivita','2026-02-17','2026-02-17',1,1,1,'#DC2626',1,1),
        ('Carnevale Ambrosiano (Mi)', 'festivita','2026-02-21','2026-02-21',1,1,1,'#DC2626',1,1),
        ('Pasqua',                    'festivita','2026-04-05','2026-04-05',1,1,1,'#DC2626',1,1),
        ('Pasquetta',                 'festivita','2026-04-06','2026-04-06',1,1,1,'#DC2626',1,1),
        ('Festa della Liberazione',   'festivita','2026-04-25','2026-04-25',1,1,1,'#DC2626',1,1),
        ('Festa della Repubblica',    'festivita','2026-06-02','2026-06-02',1,1,1,'#DC2626',1,1),
        ('Ferragosto',                'festivita','2026-08-15','2026-08-15',1,1,1,'#DC2626',1,1)
        `;

        const season2 = `
        INSERT INTO strategic_events 
        (title, event_type, start_date, end_date, affects_calendar, affects_planning, season_id, color, all_day, is_public_holiday) 
        VALUES 
        ('Tutti i Santi',             'festivita','2026-11-01','2026-11-01',1,1,2,'#DC2626',1,1),
        ('Immacolata Concezione',     'festivita','2026-12-08','2026-12-08',1,1,2,'#DC2626',1,1),
        ('Natale',                    'festivita','2026-12-25','2026-12-25',1,1,2,'#DC2626',1,1),
        ('Santo Stefano',             'festivita','2026-12-26','2026-12-26',1,1,2,'#DC2626',1,1),
        ('Capodanno',                 'festivita','2027-01-01','2027-01-01',1,1,2,'#DC2626',1,1),
        ('Epifania',                  'festivita','2027-01-06','2027-01-06',1,1,2,'#DC2626',1,1),
        ('Martedì Grasso',            'festivita','2027-02-09','2027-02-09',1,1,2,'#DC2626',1,1),
        ('Carnevale Ambrosiano (Mi)', 'festivita','2027-02-13','2027-02-13',1,1,2,'#DC2626',1,1),
        ('Pasqua',                    'festivita','2027-03-28','2027-03-28',1,1,2,'#DC2626',1,1),
        ('Pasquetta',                 'festivita','2027-03-29','2027-03-29',1,1,2,'#DC2626',1,1),
        ('Festa della Liberazione',   'festivita','2027-04-25','2027-04-25',1,1,2,'#DC2626',1,1),
        ('Festa della Repubblica',    'festivita','2027-06-02','2027-06-02',1,1,2,'#DC2626',1,1),
        ('Ferragosto',                'festivita','2027-08-15','2027-08-15',1,1,2,'#DC2626',1,1)
        `;

        await db.execute(sql.raw(season1));
        await db.execute(sql.raw(season2));
        
        console.log("=== STEP 5: Verifica Finale ===");
        const [counts] = await db.execute(sql.raw(`SELECT season_id, COUNT(*) as totale_eventi FROM strategic_events GROUP BY season_id ORDER BY season_id`));
        console.log("Eventi per stagione:", counts);

        const [events] = await db.execute(sql.raw(`SELECT id, title, start_date, is_public_holiday FROM strategic_events ORDER BY start_date`));
        console.log("Tutti gli eventi:\n", JSON.stringify(events, null, 2));

    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
    process.exit(0);
}
run();
