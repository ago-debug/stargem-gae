import { db } from "../server/db";
import { courseQuotesGrid, carnetWallets } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding Course Quotes Grid...");
    await db.insert(courseQuotesGrid).values([
      {
        activityType: "corsi",
        category: "OPEN",
        description: "1 OPEN BALLO",
        details: "SOLO 30 POSTI, Set->Lug",
        corsiWeek: 17,
        monthsData: {
          "Settembre": { quota: 1300, lezioni: 4284 },
          "Ottobre": { quota: 1300, lezioni: null },
          "Novembre": { quota: 1200, lezioni: null },
          "Dicembre": { quota: 1000, lezioni: null },
          "Gennaio": { quota: 840, lezioni: null },
          "Febbraio": { quota: 720, lezioni: null },
        }
      },
      {
        activityType: "corsi",
        category: "OPEN",
        description: "1 OPEN DANZA",
        details: "SOLO 30 POSTI, Set->Lug",
        corsiWeek: 30,
        monthsData: {
          "Settembre": { quota: 1300, lezioni: null },
          "Ottobre": { quota: 1300, lezioni: null },
          "Novembre": { quota: 1200, lezioni: null },
          "Dicembre": { quota: 1000, lezioni: null },
          "Gennaio": { quota: 840, lezioni: null },
        }
      },
      {
        activityType: "corsi",
        category: "OPEN",
        description: "2 OPEN (Danza + Ballo)",
        details: "SOLO 10 POSTI",
        corsiWeek: 30,
        monthsData: {
          "Settembre": { quota: 1950, lezioni: null },
          "Ottobre": { quota: 1950, lezioni: null },
          "Novembre": { quota: 1750, lezioni: null },
          "Dicembre": { quota: 1590, lezioni: null },
          "Gennaio": { quota: 1240, lezioni: null },
        }
      }
    ]);
  } catch (e) { console.log("Grid already exist or error:", e.message); }

  try {
    console.log("Seeding Carnet Wallets (Finti clienti)...");
    // Assegnamo un carnet fittizio al member_id 1 (sperando esista)
    await db.insert(carnetWallets).values([
      {
        memberId: 1, // Assumendo che il member 1 esista (es. Admin o un test user)
        walletTypeId: 1, // Assumendo esista una customListItems con id 1
        totalUnits: 10,
        usedUnits: 3,
        expiryDays: 90
      }
    ]);
  } catch (e) { console.log("Carnet error:", e.message); }

  console.log("Seeding part 2 completed!");
}

seed();
