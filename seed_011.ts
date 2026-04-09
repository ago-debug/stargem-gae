import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("Adding season_id to accounting_periods...");
  try {
     await db.execute(sql`
        ALTER TABLE accounting_periods
        ADD COLUMN season_id INT NULL
        REFERENCES seasons(id)
        ON DELETE SET NULL
        AFTER tenant_id;
     `);
     console.log("Column added.");
  } catch(e) {
     console.log("Column probably exists?", e.message);
  }

  console.log("Updating existing periods for season 25-26...");
  await db.execute(sql`
    UPDATE accounting_periods
    SET season_id = 1
    WHERE year IN (2025, 2026)
    AND (
      (year = 2025 AND month >= 9)
      OR
      (year = 2026 AND month <= 7)
    );
  `);

  console.log("Inserting periods for 24-25...");
  await db.execute(sql`
    INSERT INTO accounting_periods
      (tenant_id, season_id, year, month, label)
    VALUES
    (1, 3, 2024, 9,  'Settembre 2024'),
    (1, 3, 2024, 10, 'Ottobre 2024'),
    (1, 3, 2024, 11, 'Novembre 2024'),
    (1, 3, 2024, 12, 'Dicembre 2024'),
    (1, 3, 2025, 1,  'Gennaio 2025'),
    (1, 3, 2025, 2,  'Febbraio 2025'),
    (1, 3, 2025, 3,  'Marzo 2025'),
    (1, 3, 2025, 4,  'Aprile 2025'),
    (1, 3, 2025, 5,  'Maggio 2025'),
    (1, 3, 2025, 6,  'Giugno 2025');
  `);

  console.log("Inserting periods for 26-27...");
  await db.execute(sql`
    INSERT INTO accounting_periods
      (tenant_id, season_id, year, month, label)
    VALUES
    (1, 2, 2026, 9,  'Settembre 2026'),
    (1, 2, 2026, 10, 'Ottobre 2026'),
    (1, 2, 2026, 11, 'Novembre 2026'),
    (1, 2, 2026, 12, 'Dicembre 2026'),
    (1, 2, 2027, 1,  'Gennaio 2027'),
    (1, 2, 2027, 2,  'Febbraio 2027'),
    (1, 2, 2027, 3,  'Marzo 2027'),
    (1, 2, 2027, 4,  'Aprile 2027'),
    (1, 2, 2027, 5,  'Maggio 2027'),
    (1, 2, 2027, 6,  'Giugno 2027');
  `);

  console.log("Verifying seasons link...");
  const [res] = await db.execute(sql`
    SELECT s.name, COUNT(ap.id) as periodi
    FROM seasons s
    LEFT JOIN accounting_periods ap
      ON ap.season_id = s.id
    GROUP BY s.id, s.name
    ORDER BY s.start_date;
  `);
  console.table(res);

  process.exit(0);
}

run();
