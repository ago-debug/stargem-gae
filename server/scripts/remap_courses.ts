import { db, pool } from "../db";
import { members, enrollments, courses } from "@shared/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import fs from "fs";
import Papa from "papaparse";
import path from "path";

const INPUT_DIR = path.resolve(process.cwd(), "_GAE_SVILUPPO/_ANTIGRAVITY/04_dati_input");
const FILE_MASTER = path.join(INPUT_DIR, "estrap_2026-05-04_estrapolazione_Master_Gsheet - importazione copia.csv");
const FILE_WS = path.join(INPUT_DIR, "estrap_2026-03-16_estrapolazione_WORKSHOP_Gsheet - WS_master_dati copia.csv");

const HISTORICAL_COURSE_ID = 852;

// Utility to clean SKU (e.g. 2526ROSSISAB16.C -> 2526ROSSISAB16)
function cleanSku(rawSku: string): string {
  let sku = rawSku.trim();
  if (sku.match(/\.[A-Z]$/)) {
    sku = sku.slice(0, -2);
  }
  return sku;
}

async function getCourseMap() {
  const activeCourses = await db.query.courses.findMany({
    where: eq(courses.active, true)
  });
  const map = new Map<string, number>();
  for (const c of activeCourses) {
    if (c.sku) {
      map.set(c.sku, c.id);
    }
  }
  return map;
}

async function runMasterRemap(courseMap: Map<string, number>) {
  console.log("\n=== RI-MAPPATURA MASTER GSHEET ===");
  // Delete existing Master_GSheet enrollments
  const delRes = await db.delete(enrollments).where(eq(enrollments.sourceFile, "Master_GSheet"));
  console.log(`Eliminate ${delRes[0].affectedRows} vecchie iscrizioni Master_GSheet.`);

  const content = fs.readFileSync(FILE_MASTER, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let skipped = 0;

  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any) => {
      const nome = row["an_nome"]?.trim();
      const cognome = row["an_cognome"]?.trim();
      const oldId = row["an_id_anagrafica"]?.trim();
      const rawCodes = row["codici_corso_iscrizioni"]?.trim() || "";
      
      if (!nome || !cognome) {
        skipped++;
        return;
      }

      // Trova anagrafica
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

      if (!member) {
        skipped++;
        return; // Dovrebbero essere state create tutte dallo script precedente
      }

      const skus = rawCodes.split(",").map((s: string) => cleanSku(s)).filter((s: string) => s.length > 0);
      
      if (skus.length === 0) {
        // Fallback storico se nessun SKU
        try {
          await db.insert(enrollments).values({
            memberId: member.id,
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
        } catch (e) {}
      } else {
        // Inserisci un'iscrizione per ogni SKU
        for (const sku of skus) {
          const courseId = courseMap.get(sku) || HISTORICAL_COURSE_ID;
          
          try {
            await db.insert(enrollments).values({
              memberId: member.id,
              courseId: courseId,
              status: "active",
              participationType: "STANDARD_COURSE",
              gsheetChiScrive: row["chi_scrive"]?.trim() || null,
              gsheetVendita: row["vendita"]?.trim() || null,
              gsheetDescrizioneQuota: row["sz1_descrizione_quota"]?.trim() || null,
              gsheetNotePagamenti: row["sz1_note_pagamenti"]?.trim() || null,
              sourceFile: "Master_GSheet"
            });
            inserted++;
          } catch (e) {}
        }
      }
    }));
    console.log(`Completato batch: ${Math.min(i + batchSize, parsed.data.length)} / ${parsed.data.length}`);
  }
  console.log(`- Iscrizioni reali inserite: ${inserted}`);
}

async function runWorkshopRemap(courseMap: Map<string, number>) {
  console.log("\n=== RI-MAPPATURA WORKSHOP GSHEET ===");
  // Delete existing WS_GSheet enrollments
  const delRes = await db.delete(enrollments).where(eq(enrollments.sourceFile, "WS_GSheet"));
  console.log(`Eliminate ${delRes[0].affectedRows} vecchie iscrizioni WS_GSheet.`);

  const content = fs.readFileSync(FILE_WS, "utf-8");
  const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
  
  let inserted = 0;
  let skipped = 0;

  const batchSize = 100;
  for (let i = 0; i < parsed.data.length; i += batchSize) {
    const batch = parsed.data.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (row: any) => {
      const nome = row["nome"]?.trim();
      const cognome = row["cognome"]?.trim();
      const oldId = row["id_anagrafica"]?.trim();
      const rawSku = row["SKU/codice"]?.trim() || "";
      
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
        return; 
      }

      const sku = cleanSku(rawSku);
      const courseId = courseMap.get(sku) || HISTORICAL_COURSE_ID;

      try {
        await db.insert(enrollments).values({
          memberId: member.id,
          courseId: courseId,
          status: "completed", 
          participationType: "STANDARD_COURSE",
          gsheetChiScrive: row["chi_scrive"]?.trim() || null,
          gsheetVendita: row["vendita"]?.trim() || null,
          gsheetDescrizioneQuota: row["ws"]?.trim() || "Workshop",
          gsheetNotePagamenti: row["quota"]?.trim() || null,
          sourceFile: "WS_GSheet"
        });
        inserted++;
      } catch (e: any) {
        // ignore
      }
    }));
    console.log(`Completato batch: ${Math.min(i + batchSize, parsed.data.length)} / ${parsed.data.length}`);
  }
  console.log(`- Iscrizioni Workshop inserite: ${inserted}`);
}

async function main() {
  try {
    const courseMap = await getCourseMap();
    console.log(`Caricati ${courseMap.size} corsi attivi in memoria con SKU.`);
    
    await runMasterRemap(courseMap);
    await runWorkshopRemap(courseMap);

    console.log("\nRi-mappatura completata con successo!");
  } catch (e: any) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
