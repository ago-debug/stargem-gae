import { db } from './server/db.js';
import { strategicEvents } from './shared/schema.js';
import { eq, desc } from 'drizzle-orm';

async function test() {
  try {
     console.log("Tentativo inserimento via Drizzle...");
     const eventData = {
        title: "Test Zod Drizzle",
        description: null,
        eventType: "ferie",
        startDate: new Date("2026-08-10"),
        endDate: null,
        allDay: true
     };
     const [result] = await db.insert(strategicEvents).values(eventData as any);
     console.log("Drizzle Raw Result:", result);
     
     const insertId = (result as any).insertId || (result as any).id;
     console.log("Extracted Insert ID:", insertId);
     
     const [event] = await db.select().from(strategicEvents).where(eq(strategicEvents.id, insertId));
     console.log("Fetched Event:", event);
  } catch(err) {
     console.error("DRIZZLE FATAL ERROR:", err.message, err.stack);
  }
  process.exit(0);
}
test();
