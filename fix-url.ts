import 'dotenv/config';
import { db } from './server/db';
import { teamNotes } from './shared/schema';
import { like, eq } from 'drizzle-orm';

async function main() {
  const notes = await db.select().from(teamNotes).where(like(teamNotes.targetUrl, 'http%'));
  for (const n of notes) {
     if (n.targetUrl) {
         console.log("Fixing URL", n.targetUrl);
        try {
           const parsed = new URL(n.targetUrl);
           const pth = parsed.pathname;
           await db.update(teamNotes).set({ targetUrl: pth }).where(eq(teamNotes.id, n.id));
        } catch (e) {}
     }
  }
  const notes2 = await db.select().from(teamNotes).where(like(teamNotes.targetUrl, 'localhost:5001%'));
  for (const n of notes2) {
     if (n.targetUrl) {
         console.log("Fixing local URL", n.targetUrl);
        try {
           // ad-hoc fix for "localhost:5001/..."
           let p = n.targetUrl.replace("localhost:5001", "");
           await db.update(teamNotes).set({ targetUrl: p }).where(eq(teamNotes.id, n.id));
        } catch (e) {}
     }
  }
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
