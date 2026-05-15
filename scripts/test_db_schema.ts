import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("=== DB Test MC1 ===");
  try {
    const memCols = await db.execute(sql`SHOW COLUMNS FROM members LIKE 'attachments_url'`);
    if (memCols[0].length > 0) console.log("attachments_url EXISTS");
    else console.log("attachments_url MISSING");
    
    const empCols = await db.execute(sql`SHOW COLUMNS FROM team_employees LIKE 'avatar_url'`);
    if (empCols[0].length > 0) console.log("avatar_url EXISTS");
    else console.log("avatar_url MISSING");
  } catch (e: any) { console.error("Error MC1:", e.message); }

  console.log("\n=== DB Test MC2 ===");
  try {
    const dos = await db.execute(sql`SHOW TABLES LIKE 'dossiers'`);
    if (dos[0].length > 0) console.log("dossiers EXISTS");
    else console.log("dossiers MISSING");
    
    const dosSteps = await db.execute(sql`SHOW TABLES LIKE 'dossier_steps'`);
    if (dosSteps[0].length > 0) console.log("dossier_steps EXISTS");
    else console.log("dossier_steps MISSING");
    
    const dosAudit = await db.execute(sql`SHOW TABLES LIKE 'dossier_audit_log'`);
    if (dosAudit[0].length > 0) console.log("dossier_audit_log EXISTS");
    else console.log("dossier_audit_log MISSING");
  } catch (e: any) { console.error("Error MC2:", e.message); }

  console.log("\n=== DB Test MC3 ===");
  try {
    const ext = await db.execute(sql`SHOW TABLES LIKE 'external_payers'`);
    if (ext[0].length > 0) console.log("external_payers EXISTS");
    else console.log("external_payers MISSING");
    
    const soc = await db.execute(sql`SHOW TABLES LIKE 'societies'`);
    if (soc[0].length > 0) console.log("societies EXISTS");
    else console.log("societies MISSING");
    
    const parts = await db.execute(sql`SHOW TABLES LIKE 'payment_participants'`);
    if (parts[0].length > 0) console.log("payment_participants EXISTS");
    else console.log("payment_participants MISSING");
    
    const payerCol = await db.execute(sql`SHOW COLUMNS FROM payments LIKE 'payer_id'`);
    if (payerCol[0].length > 0) console.log("payer_id EXISTS");
    else console.log("payer_id MISSING");
  } catch (e: any) { console.error("Error MC3:", e.message); }
  
  process.exit(0);
}

run().catch(console.error);
