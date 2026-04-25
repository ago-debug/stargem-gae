import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
import { storage } from './server/storage.ts';

const WEEKDAYS_MAP = {
  "DOM": 0,
  "LUN": 1,
  "MAR": 2,
  "MER": 3,
  "GIO": 4,
  "VEN": 5,
  "SAB": 6
};

async function run() {
  const timestamp = new Date().toISOString().replace(/[:\-T]/g, '_').slice(0, 15);
  const backupTableName = `courses_pre_holidays_${timestamp}`;
  
  console.log(`[A] Backup: Creating table ${backupTableName}...`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS ${backupTableName} AS SELECT * FROM courses`));
  
  console.log("[B] ALTER TABLE: Adding active_on_holidays...");
  try {
    await db.execute(sql`ALTER TABLE courses ADD COLUMN active_on_holidays TINYINT(1) NOT NULL DEFAULT 0 AFTER total_occurrences;`);
  } catch (err) {
    if (!err.message.includes("Duplicate column name")) throw err;
    console.log("Column already exists.");
  }

  console.log("[C] Ricalcolo total_occurrences...");
  // Get strategic events for season 1
  const allEvents = await storage.getStrategicEvents();
  const closedEvents = allEvents.filter(e => {
    if (e.seasonId !== 1) return false;
    const type = e.eventType?.toLowerCase() || '';
    const isClosedType = type.includes('festivit') || type.includes('chiusura') || type.includes('ferie') || e.isPublicHoliday;
    return isClosedType && e.affectsCalendar === true;
  });

  const closedDays = new Set();
  closedEvents.forEach(e => {
    const start = new Date(e.startDate);
    const end = e.endDate ? new Date(e.endDate) : start;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      closedDays.add(d.toISOString().split('T')[0]);
    }
  });

  console.log(`Trovati ${closedDays.size} giorni chiusi nella stagione 1.`);

  const coursesQuery = await db.execute(sql`
    SELECT id, start_date, end_date, day_of_week 
    FROM courses 
    WHERE season_id = 1 AND activity_type = 'course'
      AND start_date IS NOT NULL AND end_date IS NOT NULL AND day_of_week IS NOT NULL
  `);
  
  const courses = coursesQuery[0] || coursesQuery;
  console.log(`Trovati ${courses.length} corsi da ricalcolare.`);
  
  let updatedCount = 0;
  for (const c of courses) {
    const targetDayInt = WEEKDAYS_MAP[c.day_of_week.toUpperCase().substring(0,3)];
    if (targetDayInt === undefined) continue;

    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    let count = 0;
    
    // Safety check max 1 year to avoid infinite loops
    let daysChecked = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysChecked++;
      if (daysChecked > 400) break; 
      
      if (d.getDay() === targetDayInt) {
        const dayStr = d.toISOString().split('T')[0];
        // Only count if NOT in closedDays OR active_on_holidays = 1 (but here it's 0)
        if (!closedDays.has(dayStr)) {
          count++;
        }
      }
    }
    
    await db.execute(sql`UPDATE courses SET total_occurrences = ${count} WHERE id = ${c.id}`);
    updatedCount++;
  }
  
  console.log(`Ricalcolo terminato. ${updatedCount} corsi aggiornati.`);

  console.log("\n[D] Verifica TOP 20 corsi...");
  const resTop = await db.execute(sql`
    SELECT id, name, day_of_week, start_date, end_date, total_occurrences, active_on_holidays
    FROM courses
    WHERE season_id = 1 AND activity_type = 'course'
    ORDER BY total_occurrences DESC
    LIMIT 20;
  `);
  console.table(resTop[0] || resTop);

  console.log("\n[D] Verifica Anomalie ( > 42 )...");
  const resAnomalies = await db.execute(sql`
    SELECT COUNT(*) as anomalie 
    FROM courses 
    WHERE season_id = 1 AND total_occurrences > 42;
  `);
  console.table(resAnomalies[0] || resAnomalies);

  process.exit(0);
}
run().catch(console.error);
