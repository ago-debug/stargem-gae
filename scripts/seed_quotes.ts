import { db } from "../server/db";
import { quotes, promoRules, welfareProviders } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding Database (with Ignore on duplicates)...");

  try {
    console.log("Seeding Quotes...");
    await db.insert(quotes).values([
      { name: "1 OPEN BALLO", amount: "1300.00", category: "Open", notes: "SOLO 30 POSTI, prezzo base", active: true },
      { name: "1 OPEN DANZA", amount: "1300.00", category: "Open", notes: "SOLO 30 POSTI, prezzo base", active: true },
      { name: "1 OPEN FITNESS", amount: "950.00", category: "Open", notes: "SOLO 30 POSTI, prezzo base", active: true },
      { name: "Lezione Individuale Singola", amount: "55.00", category: "Individuali", notes: "Periodo Sett-Lug", active: true },
      { name: "Carnet 10 Lez. Individuali (Singola)", amount: "500.00", category: "Carnet", notes: "Logica a Gettoni", active: true },
      { name: "Affitto Aula (Allievi)", amount: "20.00", category: "Affitti", notes: "Tariffa base oraria", active: true },
    ]).onDuplicateKeyUpdate({ set: { active: true } });
  } catch (e) { console.log("Quotes already exist or error:", e.message); }

  try {
    console.log("Seeding Promo Rules...");
    await db.insert(promoRules).values([
      { code: "2526ESTATE", label: "Promo Estate (5%)", ruleType: "percentage", value: "5.00", targetType: "public", validFrom: new Date("2025-06-15"), validTo: new Date("2025-07-15") },
      { code: "2526AUTUNNO-NO-ISCR", label: "Promo Autunno No-Iscr (-30%)", ruleType: "percentage", value: "30.00", targetType: "public" },
      { code: "ENTI_POLIZIA", label: "Agevolazione Forze dell'Ordine (-20%)", ruleType: "percentage", value: "20.00", targetType: "corporate", companyName: "Forze dell'Ordine", excludeOpen: true },
      { code: "ENTI_AVVOCATI", label: "Avvocati 4° Piano (-30%)", ruleType: "percentage", value: "30.00", targetType: "corporate", companyName: "Avvocati 4° Piano", excludeOpen: true },
      { code: "2526WS.ST4FF20", label: "Sconto Staff su Workshop (-20%)", ruleType: "percentage", value: "20.00", targetType: "staff" },
      { code: "2526DIREZIONE30", label: "Sconto Direzione Privato (-30%)", ruleType: "percentage", value: "30.00", targetType: "private", internalNotes: "Per Carlotta Alfano" },
    ]).onDuplicateKeyUpdate({ set: { value: sql`VALUES(value)` } });
  } catch (e) { console.log("Promo already exist or error:", e.message); }

  try {
    console.log("Seeding Welfare Providers...");
    await db.insert(welfareProviders).values([
      { name: "FITPRIME", requiresMembershipFee: true, requiresMedicalCert: true, availableCategories: "DANZA, FITNESS", operativeNotes: "Pacc. BASE: 50€/4 ingressi. CHECK IN prima della lezione", isActive: true },
      { name: "WELLHUB (ex Gympass)", requiresMembershipFee: false, requiresMedicalCert: true, availableCategories: "DANZA, FITNESS", operativeNotes: "Max 8 ingressi al mese. CHECK IN prima della lezione", isActive: true },
      { name: "PELLEGRINI", requiresMembershipFee: true, requiresMedicalCert: true, availableCategories: "DANZA, BALLO, FITNESS, AERIAL", extraFeePercent: "3.00", operativeNotes: "Verificare ricezione voucher via email.", isActive: true },
      { name: "WAI", requiresMembershipFee: true, requiresMedicalCert: true, availableCategories: "DANZA, BALLO, FITNESS, AERIAL", extraFeePercent: "7.00", operativeNotes: "Verificare ricezione voucher via email.", isActive: true },
    ]).onDuplicateKeyUpdate({ set: { isActive: true } });
  } catch (e) { console.log("Welfare already exist or error:", e.message); }

  console.log("Seeding completed successfully!");
}

seed();
