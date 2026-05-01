import "dotenv/config";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Forzando botAI ad essere ONLINE e IN SEDE...");
  
  // 1. Forza ONLINE (heartbeat equivalente)
  const now = new Date();
  await db.update(users)
    .set({ 
      lastSeenAt: now,
      currentSessionStart: now,
      stato: 'online'
    })
    .where(eq(users.username, "botAI"));
  
  console.log("Stato bot aggiornato a ONLINE.");

  // 2. Esegui il vero check-in tramite API per registrare il movimento hr
  const loginRes = await fetch("http://localhost:5001/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "botAI", password: "botAI123!" })
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

  // Assicuriamoci che lui non risulti già IN per via di altri test
  // (L'API potrebbe rifiutare un IN se è già IN?) in teoria no, nel dubbio facciamo POST OUT e poi POST IN.
  console.log("Eseguo check-in...");
  const inRes = await fetch("http://localhost:5001/api/gemteam/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({ tipo: "IN", employee_id: 16 })
  });
  console.log("Check-in IN HTTP:", inRes.status, await inRes.text());
  
  process.exit(0);
}

run().catch(console.error);
