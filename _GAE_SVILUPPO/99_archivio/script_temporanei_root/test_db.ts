import { db } from './server/db';
import { teamScheduledShifts } from './shared/schema';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    const records = await db.select().from(teamScheduledShifts).limit(1);
    if (!records.length) return console.log("No records");
    const rec = records[0];
    console.log("Found:", rec);
    
    // Simula la patch esatta:
    const data = "2026-04-19";
    const employeeId = rec.employeeId;
    
    await db.update(teamScheduledShifts).set({
       ...(employeeId ? {employeeId} : {}), 
       ...(data ? {data} : {}), 
       updatedAt: new Date()
    }).where(eq(teamScheduledShifts.id, rec.id));
    console.log("Success update string data");
    
  } catch(e) {
    console.error("ERRORE UPDATE DATA:", e);
  }
  process.exit();
}

run();
