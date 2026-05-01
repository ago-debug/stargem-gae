import { db } from './server/db';
import { teamNotifications } from './shared/schema';

async function run() {
  try {
    await db.insert(teamNotifications).values({
      employeeId: 5,
      tipo: 'turno_modificato', 
      titolo: 'Turno modificato',
      messaggio: `Il tuo turno del ciao è stato modificato.`,
      dataRiferimento: new Date()
    });
    console.log("Success insert notification");
  } catch(e) {
    console.error("ERRORE NOTIFICATION:", e);
  }
  process.exit();
}
run();
