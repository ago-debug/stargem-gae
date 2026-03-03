import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function run() {
  const tables = [
    'workshops',
    'paid_trials',
    'free_trials',
    'single_lessons',
    'sunday_activities',
    'trainings',
    'individual_lessons',
    'campus_activities',
    'recitals',
    'vacation_studies'
  ];

  try {
    for (const table of tables) {
      console.log(`Working on ${table}...`);
      try {
        await db.execute(sql.raw(`ALTER TABLE ${table} DROP FOREIGN KEY ${table}_secondary_instructor2_id_instructors_id_fk`));
      } catch(e) { }
      try {
        await db.execute(sql.raw(`ALTER TABLE ${table} DROP COLUMN secondary_instructor2_id`));
      } catch(e) { }
      try {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN quote_id int NULL`));
      } catch(e) { }
      try {
        await db.execute(sql.raw(`ALTER TABLE ${table} ADD CONSTRAINT ${table}_quote_id_quotes_id_fk FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL`));
      } catch(e) { }
    }
    
    // courses table separately (only drop)
    console.log(`Working on courses...`);
    try {
      await db.execute(sql.raw(`ALTER TABLE courses DROP FOREIGN KEY courses_secondary_instructor2_id_instructors_id_fk`));
    } catch(e) {}
    try {
      await db.execute(sql.raw(`ALTER TABLE courses DROP COLUMN secondary_instructor2_id`));
    } catch(e) {}

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
run();
