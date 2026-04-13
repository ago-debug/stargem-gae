import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    console.log("=== 1. Verifica colonne auth già presenti in members ===");
    const res1a = await db.execute(sql`SHOW COLUMNS FROM members WHERE Field IN ('user_id', 'participant_type');`);
    console.log(res1a[0]);

    console.log("\n=== 1. Verifica colonne auth già presenti in users ===");
    const res1b = await db.execute(sql`SHOW COLUMNS FROM users WHERE Field IN ('email_verified', 'otp_token', 'otp_expires_at');`);
    console.log(res1b[0]);

    console.log("\n=== 2. Tabelle team_* già esistenti ===");
    const res2 = await db.execute(sql`SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'stargem_v2' AND TABLE_NAME LIKE 'team_%' ORDER BY TABLE_NAME;`);
    console.log(res2[0]);

    console.log("\n=== 3. Users esistenti con ruoli rilevanti ===");
    const res3 = await db.execute(sql`SELECT id, username, email, role, first_name, last_name FROM users WHERE role IN ('operator','admin','dipendente','insegnante') ORDER BY role, last_name LIMIT 40;`);
    console.log(res3[0]);

    console.log("\n=== 4. Stato participant_type in members ===");
    const res4 = await db.execute(sql`SELECT participant_type, COUNT(*) as tot FROM members GROUP BY participant_type ORDER BY tot DESC;`);
    console.log(res4[0]);

    console.log("\n=== 5. Dipendenti già presenti ===");
    const res5 = await db.execute(sql`SELECT id, first_name, last_name, email, participant_type, user_id FROM members WHERE participant_type LIKE '%ipendente%' OR first_name IN ('Alexandra','Giuditta','Estefany','Nura','Joel','Kevin','Zoila','Jasir','Sara','Massi','Santo','Diego') LIMIT 20;`);
    console.log(res5[0]);

  } catch (err) {
    console.error("Error executing queries:", err);
  }
  process.exit(0);
}

run();
