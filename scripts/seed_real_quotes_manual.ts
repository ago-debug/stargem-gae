import "dotenv/config";
import { db } from "../server/db";
import { 
  courseQuotesGrid, 
  promoRules, 
  welfareProviders, 
  customLists,
  customListItems,
  carnetWallets
} from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

const PERIODS = [
    "Settembre", "Ottobre", "Novembre", "Dicembre",
    "Gennaio", "Febbraio", "Marzo", "Aprile",
    "Maggio", "Giugno"
];

async function main() {
  console.log("Iniziando il reset e l'inserimento dei dati reali (Quote e Promo)...");

  // 1. DELETE OLD DATA
  console.log("Cancellando dati vecchi...");
  await db.delete(courseQuotesGrid);
  await db.delete(promoRules);
  await db.delete(welfareProviders);
  await db.delete(carnetWallets);
  
  const walletTypesList = await db.select().from(customLists).where(eq(customLists.systemName, "wallet_types"));
  if (walletTypesList.length > 0) {
    await db.delete(customListItems).where(eq(customListItems.listId, walletTypesList[0].id));
  }

  // 2. INSERIMENTO LISTINO PREZZI (courseQuotesGrid) - 10 RIGHE PER CATEGORIA
  console.log("Inserimento Listino Prezzi Reale...");
  const realQuotes: Array<{cat: string, desc: string, det: string, q: number[], type: string}> = [];
  
  // 10 OPEN
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "open", cat: "OPEN", desc: `${i} OPEN BALLO/FITNESS`, det: "Periodo Settembre -> Luglio", q: [1300, 1200, 1000, 840, 720, 600, 480, 360, 240, 120] });
  }

  // 10 ADULTI
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "adulti", cat: "ADULTI", desc: `${i} CORSI BALLO/FITNESS`, det: `${i}v/sett`, q: [450*i, 420*i, 380*i, 340*i, 300*i, 260*i, 220*i, 180*i, 140*i, 100*i] });
  }

  // 10 BAMBINI
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "bambini", cat: "BAMBINI", desc: `${i} CORSI DANZA BABY`, det: `${i}v/sett`, q: [380*i, 350*i, 320*i, 290*i, 260*i, 230*i, 200*i, 170*i, 140*i, 100*i] });
  }

  // 10 AERIAL
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "aerial", cat: "AERIAL", desc: `${i} CORSI AERIAL`, det: `${i}v/sett`, q: [500*i, 470*i, 430*i, 380*i, 330*i, 280*i, 230*i, 180*i, 130*i, 80*i] });
  }

  // 10 PRIVATA
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "privata", cat: "PRIVATA", desc: `${i} LEZIONI PRIVATE (Pacchetto)`, det: "1 allievo + 1 maestro", q: [50*i, 50*i, 50*i, 50*i, 50*i, 50*i, 50*i, 50*i, 50*i, 50*i] });
  }

  // 10 AFFITTO
  for (let i = 1; i <= 10; i++) {
    realQuotes.push({ type: "affitto", cat: "AFFITTO", desc: `${i} ORE AFFITTO SALA`, det: "Affitto orario / pacchetti", q: [20*i, 20*i, 20*i, 20*i, 20*i, 20*i, 20*i, 20*i, 20*i, 20*i] });
  }

  for (let i = 0; i < realQuotes.length; i++) {
    const quote = realQuotes[i];
    const monthsData: Record<string, any> = {};
    PERIODS.forEach((p, idx) => {
      monthsData[p] = { quota: quote.q[idx], lezioni: null };
    });
    
    const activityTypeStr = quote.type;

    await db.insert(courseQuotesGrid).values({
      activityType: activityTypeStr,
      category: quote.cat,
      description: quote.desc,
      details: quote.det,
      corsiWeek: quote.desc.startsWith("2") ? 2 : 1,
      sortOrder: i + 1,
      monthsData: JSON.stringify(monthsData)
    });
  }

  // 3. INSERIMENTO PROMO E CODICI (promoRules)
  console.log("Inserimento Promo...");
  await db.insert(promoRules).values([
    {
      code: "2526PRIMAVERA",
      label: "PROMO dal 20 Maggio al 14 Giugno (OPEN PAGATO 100%)",
      ruleType: "percentage",
      value: "100.00",
      targetType: "public",
      validFrom: new Date("2025-05-20"),
      validTo: new Date("2025-06-14")
    },
    {
      code: "2526ESTATE",
      label: "PROMO dal 15 Giugno al 15 Luglio",
      ruleType: "percentage",
      value: "5.00",
      targetType: "public",
      validFrom: new Date("2025-06-15"),
      validTo: new Date("2025-07-15")
    },
    {
      code: "2526AUTUNNO-ISCR",
      label: "PROMO OTTOBRE (Iscritti)",
      ruleType: "percentage",
      value: "10.00",
      targetType: "public",
      validFrom: new Date("2025-10-01"),
      validTo: new Date("2025-10-31")
    }
  ]);

  // 4. INSERIMENTO WELFARE AZIENDALI (welfareProviders)
  console.log("Inserimento Welfare...");
  await db.insert(welfareProviders).values([
    {
      name: "FITPRIME",
      integrationType: "manual",
      category: "Danza, Fitness",
      details: "Pacc. BASE: 50€ per 4 ingressi. Pacc. MEDIUM: 100€ per 8 ingressi. Pacc. LARGE: 150€ per mese.",
      extraFee: "0.00",
      requiresCard: true,
      requiresMedicalCert: true,
      isActive: true
    },
    {
      name: "EDENRED",
      integrationType: "manual",
      category: "Generale",
      details: "Voucher Welfare Edenred",
      extraFee: "0.00",
      requiresCard: true,
      requiresMedicalCert: true,
      isActive: true
    }
  ]);

  // 5. INSERIMENTO CARNET / ABBONAMENTI PREPAGATI (carnetWallets & customListItems)
  console.log("Inserimento Carnet / Affitti...");
  
  const customTypes = [
    { listId: walletTypesList[0].id, value: "affitto_10_ore", label: "10 ORE PACCHETTO Lezioni Individuali/Prove", sortOrder: 1, active: true },
    { listId: walletTypesList[0].id, value: "affitto_10_ore_pole", label: "10 ORE PACCHETTO Pole/Cerchio/Tessuti", sortOrder: 2, active: true },
    { listId: walletTypesList[0].id, value: "carnet_maestri", label: "10 Lezioni Pacchetto (Maestri)", sortOrder: 3, active: true }
  ];
  
  await db.insert(customListItems).values(customTypes);
  
  const insertedTypes = await db.select().from(customListItems).where(eq(customListItems.listId, walletTypesList[0].id));
  
  // Usa il primo memberId disponibile per assegnare i carnet di prova
  const memberRes = await db.execute("SELECT id FROM members LIMIT 1");
  const memberId = (memberRes as any)[0][0]?.id || 1;

  await db.insert(carnetWallets).values([
    {
      memberId: memberId,
      walletTypeId: insertedTypes[0].id,
      totalUnits: 10,
      usedUnits: 0,
      expiryDays: 120, // 4 mesi dal file
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      memberId: memberId,
      walletTypeId: insertedTypes[1].id,
      totalUnits: 10,
      usedUnits: 2,
      expiryDays: 120,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      isActive: true
    },
    {
      memberId: memberId,
      walletTypeId: insertedTypes[2].id,
      totalUnits: 10,
      usedUnits: 5,
      expiryDays: 90, // 90 giorni dal file
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true
    }
  ]);

  console.log("IMPORTAZIONE REALE COMPLETATA CON SUCCESSO!");
  process.exit(0);
}

main().catch(err => {
  console.error("Errore nell'importazione:", err);
  process.exit(1);
});
