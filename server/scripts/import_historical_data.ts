import { db, pool } from "../db";
import { members, enrollments } from "@shared/schema";
import { eq, or, and } from "drizzle-orm";
import fs from "fs";
import Papa from "papaparse";
import path from "path";

const INPUT_DIR = path.resolve(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input");
const FILE_1 = path.join(INPUT_DIR, "estrap_2026-04-15_anagrafica_Athena - AnaPersoneFullExcel copia.csv");
const FILE_2 = path.join(INPUT_DIR, "estrap_2026-05-04_estrapolazione_Master_Gsheet - importazione copia.csv");
const FILE_3 = path.join(INPUT_DIR, "estrap_2026-04-15_ElencoPartecipazioni_Athena - ElencoIscrizioni copia.csv");
const FILE_4 = path.join(INPUT_DIR, "estrap_2026-03-16_estrapolazione_WORKSHOP_Gsheet - WS_master_dati copia.csv");

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  dateStr = dateStr.trim();
  if (!dateStr) return null;

  // DD/MM/YYYY
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m}-${d}T12:00:00Z`);
  }
  // YYYY-MM-DD
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(`${dateStr}T12:00:00Z`);
  }
  return null;
}

async function runPhase1() {
  console.log("\n=== FASE 1: Importazione Anagrafica da Athena ===");
  const content = fs.readFileSync(FILE_1, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Esegui in batch di 100
  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any, index: number) => {
      const nome = row["Nome"]?.trim() || "Sconosciuto";
      const cognome = row["Cognome"]?.trim() || "Sconosciuto";
      const cf = row["Cod. Fiscale"]?.trim() || null;
      const athenaId = row["Codice"]?.trim() || null;

      if (nome === "Sconosciuto" && cognome === "Sconosciuto") {
        skipped++;
        return;
      }

      const payload: any = {
        firstName: nome,
        lastName: cognome,
        fiscalCode: cf,
        gender: row["Sesso"]?.trim() || null,
        dateOfBirth: parseDate(row["Data di Nascita"]),
        placeOfBirth: row["Città Nasc."]?.trim() || null,
        birthProvince: row["Prov. Nasc"]?.trim() || null,
        birthNation: row["Nazione Nasc."]?.trim() || null,
        address: row["Indirizzo"]?.trim() || null,
        postalCode: row["CAP"]?.trim() || null,
        city: row["Citta Resid."]?.trim() || null,
        province: row["Provincia"]?.trim() || null,
        country: row["Nazione"]?.trim() || "Italia",
        phone: row["Telefono"]?.trim() || null,
        mobile: row["Cellulare"]?.trim() || null,
        email: row["E-Mail"]?.trim() || null,
        secondaryEmail: row["E-Mail 2"]?.trim() || null,
        
        previousMembershipNumber: row["Tessera"]?.trim() || null,
        cardExpiryDate: parseDate(row["Scad. Tessera Socio"]),
        medicalCertificateExpiry: parseDate(row["Scadenza Visita"]),
        
        tutor1FirstName: row["Nome Tutore"]?.trim() || null,
        tutor1LastName: row["Cognome Tutore"]?.trim() || null,
        tutor1FiscalCode: row["Cod.Fisc. Tutore"]?.trim() || null,
        
        tutor2FirstName: row["Nome Tutore 2"]?.trim() || null,
        tutor2LastName: row["Cognome Tutore 2"]?.trim() || null,
        
        height: row["Altezza"]?.trim() || null,
        weight: row["Peso"]?.trim() || null,
        sizeShirt: row["Taglia Maglia"]?.trim() || null,
        sizePants: row["Taglia pantaloni"]?.trim() || null,
        sizeShoes: row["Taglia Scarpe"]?.trim() || null,
        
        socialFacebook: row["ID Facebook"]?.trim() || null,
        website: row["Sito"]?.trim() || null,
        
        carPlate: row["Targa"]?.trim() || null,
        patenteTipo: row["Patente"]?.trim() || null,
        patenteScadenza: parseDate(row["Scad Patente"]),
        
        emergencyContact1Name: row["Contatto1"]?.trim() || null,
        emergencyContact1Phone: row["Tel Cont 1"]?.trim() || null,
        
        athenaId: athenaId,
        athenaMemberType: row["Tipo"]?.trim() || null,
        athenaGroup: row["Gruppo"]?.trim() || null,
      };

      try {
        let existing = null;
        if (cf) {
          existing = await db.query.members.findFirst({
            where: eq(members.fiscalCode, cf)
          });
        } else if (athenaId) {
          existing = await db.query.members.findFirst({
            where: eq(members.athenaId, athenaId)
          });
        }

        let insertedId = 0;
        if (existing) {
          await db.update(members).set(payload).where(eq(members.id, existing.id));
          insertedId = existing.id;
          updated++;
        } else {
          const res = await db.insert(members).values(payload);
          insertedId = res[0].insertId;
          inserted++;
        }

        // Generate card number
        if (insertedId > 0) {
          const cardNum = `2526-${insertedId.toString().padStart(6, '0')}`;
          await db.update(members).set({ cardNumber: cardNum }).where(eq(members.id, insertedId));
        }
      } catch (e: any) {
        if (!e.message.includes('Duplicate entry')) {
          console.log(`Errore riga (${nome} ${cognome}):`, e.message);
        }
        skipped++;
      }
    }));
    console.log(`Completato batch: ${i + batch.length} / ${parsed.data.length}`);
  }

  console.log(`- Inseriti: ${inserted}`);
  console.log(`- Aggiornati: ${updated}`);
  console.log(`- Saltati (errori/vuoti): ${skipped}`);
}

async function runPhase2() {
  console.log("\n=== FASE 2: Importazione Vendite Master (GSheet) ===");
  const content = fs.readFileSync(FILE_2, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let newLightMembers = 0;
  let skipped = 0;

  const HISTORICAL_COURSE_ID = 852;

  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any) => {
      const nome = row["an_nome"]?.trim();
      const cognome = row["an_cognome"]?.trim();
      const oldId = row["an_id_anagrafica"]?.trim();
      
      if (!nome || !cognome) {
        skipped++;
        return; // Skip empty rows
      }

      // Find member
      let member = null;
      if (oldId) {
        member = await db.query.members.findFirst({ where: eq(members.athenaId, oldId) });
      }
      if (!member) {
        const allMatches = await db.select().from(members).where(and(eq(members.firstName, nome), eq(members.lastName, cognome)));
        if (allMatches.length > 0) member = allMatches[0];
      }
      if (!member && row["an_cod_fiscale"]) {
        member = await db.query.members.findFirst({ where: eq(members.fiscalCode, row["an_cod_fiscale"].trim()) });
      }

      let memberId = member?.id;
      if (!memberId) {
        try {
          // Create Light Member
          const res = await db.insert(members).values({
            firstName: nome,
            lastName: cognome,
            athenaId: oldId || null,
            phone: row["an_telefono"]?.trim() || null,
            email: row["an_email"]?.trim() || null,
            fiscalCode: row["an_cod_fiscale"]?.trim() || null,
          });
          memberId = res[0].insertId;
          const cardNum = `2526-${memberId.toString().padStart(6, '0')}`;
          await db.update(members).set({ cardNumber: cardNum }).where(eq(members.id, memberId));
          newLightMembers++;
        } catch (e: any) {
          console.log("Errore creazione light member:", e.message);
          skipped++;
          return;
        }
      }

      // Create Enrollment
      try {
        await db.insert(enrollments).values({
          memberId: memberId,
          courseId: HISTORICAL_COURSE_ID,
          status: "active",
          participationType: "STANDARD_COURSE",
          gsheetChiScrive: row["chi_scrive"]?.trim() || null,
          gsheetVendita: row["vendita"]?.trim() || null,
          gsheetDescrizioneQuota: row["sz1_descrizione_quota"]?.trim() || null,
          gsheetNotePagamenti: row["sz1_note_pagamenti"]?.trim() || null,
          sourceFile: "Master_GSheet"
        });
        inserted++;
      } catch (e: any) {
        console.log("Errore iscrizione", e.message);
      }
    }));
    console.log(`Completato batch: ${i + batch.length} / ${parsed.data.length}`);
  }

  console.log(`- Nuove Iscrizioni importate: ${inserted}`);
  console.log(`- Nuove Anagrafiche "Light" create: ${newLightMembers}`);
  console.log(`- Saltate (senza nome/cognome): ${skipped}`);
}

async function runPhase3() {
  console.log("\n=== FASE 3: Importazione Partecipazioni (Athena) ===");
  const content = fs.readFileSync(FILE_3, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let skipped = 0;
  const HISTORICAL_COURSE_ID = 852;

  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any) => {
      const oldId = row["Cod. Anag."]?.trim();
      if (!oldId) {
        skipped++;
        return;
      }

      const member = await db.query.members.findFirst({ where: eq(members.athenaId, oldId) });
      if (!member) {
        skipped++;
        return;
      }

      // Check if this member already has a Master_GSheet enrollment for this course
      const existingGSheet = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.memberId, member.id),
          eq(enrollments.courseId, HISTORICAL_COURSE_ID),
          eq(enrollments.sourceFile, "Master_GSheet")
        )
      });

      if (existingGSheet) {
        // We update the existing record with Athena details if we want to merge them
        await db.update(enrollments).set({
          athenaStatoIscrizione: row["Stato Iscrizione"]?.trim() || null,
          athenaNote: row["Note interne"]?.trim() || null,
        }).where(eq(enrollments.id, existingGSheet.id));
        inserted++;
      } else {
        // Create new enrollment
        try {
          await db.insert(enrollments).values({
            memberId: member.id,
            courseId: HISTORICAL_COURSE_ID,
            status: "active",
            participationType: "STANDARD_COURSE",
            athenaStatoIscrizione: row["Stato Iscrizione"]?.trim() || null,
            athenaNote: row["Note interne"]?.trim() || null,
            sourceFile: "Athena_Elenco"
          });
          inserted++;
        } catch (e: any) {
          console.log("Errore iscrizione", e.message);
        }
      }
    }));
    console.log(`Completato batch: ${i + batch.length} / ${parsed.data.length}`);
  }
  console.log(`- Iscrizioni Athena importate o mergiate: ${inserted}`);
  console.log(`- Saltate (anagrafica non trovata): ${skipped}`);
}

async function runPhase4() {
  console.log("\n=== FASE 4: Importazione Workshop (GSheet) ===");
  const content = fs.readFileSync(FILE_4, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let skipped = 0;
  const HISTORICAL_COURSE_ID = 852; // Usiamo lo stesso corso storico

  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any) => {
      const oldId = row["id_anagrafica"]?.trim();
      const nome = row["nome"]?.trim();
      const cognome = row["cognome"]?.trim();

      if (!nome || !cognome) {
        skipped++;
        return;
      }

      let member = null;
      if (oldId) {
        member = await db.query.members.findFirst({ where: eq(members.athenaId, oldId) });
      }
      if (!member) {
        const allMatches = await db.select().from(members).where(and(eq(members.firstName, nome), eq(members.lastName, cognome)));
        if (allMatches.length > 0) member = allMatches[0];
      }

      if (!member) {
        skipped++;
        return; // Non creiamo utenze light per i workshop
      }

      try {
        await db.insert(enrollments).values({
          memberId: member.id,
          courseId: HISTORICAL_COURSE_ID,
          status: "completed", // I workshop storici sono conclusi
          participationType: "STANDARD_COURSE",
          gsheetChiScrive: row["chi_scrive"]?.trim() || null,
          gsheetVendita: row["vendita"]?.trim() || null,
          gsheetDescrizioneQuota: row["ws"]?.trim() || "Workshop",
          gsheetNotePagamenti: row["quota"]?.trim() || null,
          sourceFile: "WS_GSheet"
        });
        inserted++;
      } catch (e: any) {
        console.log("Errore workshop", e.message);
      }
    }));
    console.log(`Completato batch: ${i + batch.length} / ${parsed.data.length}`);
  }
  console.log(`- Iscrizioni Workshop importate: ${inserted}`);
}

async function main() {
  try {
    // await runPhase1();
    await runPhase2();
    await runPhase3();
    await runPhase4();
    console.log("\nImportazione completata.");
  } catch (e: any) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
