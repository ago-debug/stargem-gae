import { db } from "./server/db";
import { users } from "./shared/schema";
import { inArray, eq } from "drizzle-orm";

async function run() {
  try {
    // Aggiorniamo 'Jasir' e 'Kevin' a 'team' (o 'operator' / 'admin' a seconda della necessità, mettiamo 'admin' o 'operator'. Il loro vecchio ruolo era probabilmente 'operator')
    // Controlliamo cosa hanno adesso
    const prima = await db.select().from(users).where(inArray(users.username, ['Jasir', 'Kevin']));
    console.log("Stato Prima:", prima.map(u => ({ username: u.username, role: u.active_role })));

    // Update
    await db.update(users)
      .set({ active_role: 'operator' }) // operator li farà tornare nel Team
      .where(inArray(users.username, ['Jasir', 'Kevin']));

    const dopo = await db.select().from(users).where(inArray(users.username, ['Jasir', 'Kevin']));
    console.log("Stato Dopo (Modificati con successo):", dopo.map(u => ({ username: u.username, role: u.active_role })));
    
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
