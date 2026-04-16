import 'dotenv/config';
import mysql from 'mysql2/promise';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

function normalizeCF(cf: string): string | null {
  if (!cf) return null;
  const normalized = cf.trim().toUpperCase();
  // Filter out clearly invalid CFs like 'NON COMUNICATO', 'ASSENTE'
  if (normalized.length < 16 || normalized.includes(' ')) return null;
  return normalized;
}

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // 1. Get all active DB members CFs
  const [dbMembers] = await connection.query(`
    SELECT fiscal_code 
    FROM members 
    WHERE fiscal_code IS NOT NULL 
      AND fiscal_code != '' 
      AND (active != 0 OR active IS NULL)
  `) as any[];
  
  const dbSet = new Set<string>();
  dbMembers.forEach(m => {
    const cf = normalizeCF(m.fiscal_code);
    if (cf) dbSet.add(cf);
  });
  
  console.log(`Caricati ${dbSet.size} CF univoci attivi dal DB.`);

  // 2. Define expected files and target columns
  const filesToCheck = [
    {
      pattern: 'estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx',
      sheetFallbacks: ['importazione', 'Anagrafica'],
      cols: ['an_cod_fiscale', 'Codice Fiscale', 'Cod. Fiscale']
    },
    {
      pattern: 'estrap_20260415_AnaPersoneFullExcel.xlsx',
      sheetFallbacks: ['AnaPersoneFullExcel'],
      cols: ['Cod. Fiscale']
    },
    {
      pattern: 'estrap_20260415_ElencoIscrizioni.xlsx',
      sheetFallbacks: ['ElencoIscrizioni'],
      cols: ['Cod. Fisc.']
    },
    {
      pattern: 'WS_master_dati', // from *Workshop.xlsx
      sheetFallbacks: ['WS_master_dati', 'Sheet1'],
      cols: ['codice_fiscale', 'Codice Fiscale']
    }
  ];

  const tempDir = path.join(process.cwd(), 'temp_import');
  const tempFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
  
  const allExcelSet = new Set<string>();

  for (const fDef of filesToCheck) {
    const matchedFile = tempFiles.find(f => f.includes(fDef.pattern) || fDef.pattern.includes(f));
    
    console.log(`\n--- Verifica File: ${fDef.pattern} ---`);
    if (!matchedFile) {
      console.log(`[ATTENZIONE] File non trovato in temp_import/`);
      continue;
    }

    const fullPath = path.join(tempDir, matchedFile);
    const wb = xlsx.read(fs.readFileSync(fullPath), { type: 'buffer' });
    
    const dbHit = new Set<string>();
    const dbMiss = new Set<string>();
    
    // Find right sheet
    let targetSheetName = wb.SheetNames[0];
    for (const s of fDef.sheetFallbacks) {
      if (wb.Sheets[s]) {
         targetSheetName = s;
         break;
      }
    }
    
    const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[targetSheetName]);
    
    for (const r of rows) {
      let rawCF = null;
      for (const col of fDef.cols) {
        if (r[col]) { rawCF = r[col]; break; }
      }
      // If not found by exact string, try looking by lower casing all keys
      if (!rawCF) {
        const lowerKeys = Object.keys(r).map(k => k.toLowerCase());
        for (const col of fDef.cols) {
          const idx = lowerKeys.indexOf(col.toLowerCase());
          if (idx !== -1) {
            rawCF = r[Object.keys(r)[idx]];
            break;
          }
        }
      }

      if (rawCF) {
        const cf = normalizeCF(String(rawCF));
        if (cf) {
          allExcelSet.add(cf);
          if (dbSet.has(cf)) {
            dbHit.add(cf);
          } else {
            dbMiss.add(cf);
          }
        }
      }
    }

    console.log(`Trovati in Excel: ${dbHit.size + dbMiss.size} CF validi.`);
    console.log(`  - Esistenti su DB: ${dbHit.size}`);
    console.log(`  - NON esistenti su DB: ${dbMiss.size}`);
    
    if (dbMiss.size > 0) {
      console.log(`  - Primi 5 mancanti: ${Array.from(dbMiss).slice(0, 5).join(', ')}`);
    } else {
      console.log(`  - Primi 5 mancanti: (Nessuno)`);
    }
  }

  // 4. Calculate DB CFs not in ANY excel
  let dbOnlyCount = 0;
  for (const dbCf of dbSet) {
    if (!allExcelSet.has(dbCf)) {
      dbOnlyCount++;
    }
  }
  
  console.log(`\n--- Riepilogo Finale ---`);
  console.log(`CF presenti SOLO in DB (nessun Excel): ${dbOnlyCount}`);

  await connection.end();
}

run().catch(console.error);
