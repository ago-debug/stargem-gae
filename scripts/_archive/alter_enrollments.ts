import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function alterTable() {
  try {
    console.log("Adding participationType and targetDate to enrollments...");
    
    // Check if columns exist first to avoid errors on rerun
    const checkColumns = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sg_gae' 
      AND TABLE_NAME = 'enrollments' 
      AND COLUMN_NAME IN ('participation_type', 'target_date');
    `);
    
    const existingCols = (checkColumns[0] as any[]).map(c => c.COLUMN_NAME);
    
    if (!existingCols.includes('participation_type')) {
      await pool.query(`ALTER TABLE enrollments ADD COLUMN participation_type VARCHAR(50) DEFAULT 'STANDARD_COURSE'`);
      console.log("Added participation_type column.");
    } else {
      console.log("Column participation_type already exists.");
    }

    if (!existingCols.includes('target_date')) {
      await pool.query(`ALTER TABLE enrollments ADD COLUMN target_date DATE`);
      console.log("Added target_date column.");
    } else {
      console.log("Column target_date already exists.");
    }

    console.log("Alter table complete.");
  } catch (error) {
    console.error("Error altering table:", error);
  } finally {
    process.exit(0);
  }
}

alterTable();
