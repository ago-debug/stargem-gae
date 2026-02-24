import { db } from "./server/db";
import { payments, members } from "./shared/schema";
import { sql } from "drizzle-orm";

async function clear() {
  try {
    // Delete all payments
    await db.delete(payments);
    console.log("✅ Tabella pagamenti svuotata.");

    // Reset credit balance for all members
    await db.update(members).set({ creditBalance: "0.00" });
    console.log("✅ Saldi credito clienti resettati a 0.");
    
    process.exit(0);
  } catch (e) {
    console.error("Errore:", e);
    process.exit(1);
  }
}

clear();
