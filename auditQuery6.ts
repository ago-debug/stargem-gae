import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== STEP A: Controllo Esistenza 15 Tabelle ===");
    const res = await db.execute(sql`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'stargem_v2' 
      AND TABLE_NAME IN (
        'team_employees',
        'team_shift_templates',
        'team_scheduled_shifts',
        'team_activity_types',
        'team_shift_diary_entries',
        'team_attendance_logs',
        'team_checkin_events',
        'team_leave_requests',
        'team_handover_notes',
        'team_maintenance_tickets',
        'team_monthly_reports',
        'team_profile_change_requests',
        'team_documents',
        'team_document_versions',
        'team_document_alerts',
        'team_employee_activity_log'
      );
    `);
    if (res[0].length === 0) {
      console.log("RISULTATO: 0 righe (Nessuna delle 15 tabelle esiste già).");
    } else {
      console.log("RISULTATO: TROVATE TABELLE!", res[0]);
    }
  } catch (err) {
    console.error("Error executing queries:", err);
  }
  process.exit(0);
}

run();
