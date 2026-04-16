import * as xlsx from 'xlsx';
import * as fs from 'fs';

function run() {
  const file = 'temp_import/estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx';
  const wb = xlsx.read(fs.readFileSync(file), { cellDates: true });
  const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['Anagrafica'] || wb.Sheets[wb.SheetNames[0]]);
  
  const map = new Map<string, Set<string>>(); // key: name+phone, value: Set<CFs>

  for (const row of rows) {
    const nome = String(row['Nome'] || '').trim().toUpperCase();
    const cognome = String(row['Cognome'] || '').trim().toUpperCase();
    const tel = String(row['Telefono'] || '').trim();
    const cf = String(row['Codice Fiscale'] || '').trim().toUpperCase();
    
    if (!nome || !cognome || !tel) continue;
    
    const key = `${nome}_${cognome}_${tel}`;
    if (!map.has(key)) {
      map.set(key, new Set<string>());
    }
    if (cf) {
        map.get(key)!.add(cf);
    } else {
        map.get(key)!.add('NO_CF_1_' + Math.random()); // Hack to count as distinct if NO CF
    }
  }

  let dupesCount = 0;
  for (const [key, cfs] of map.entries()) {
    if (cfs.size > 1) {
      dupesCount++;
    }
  }

  console.log("=== STEP 5 - Excel Master ===");
  console.log(`Trovate ${dupesCount} righe con stesso Nome+Cognome+Telefono ma CF diverso (o assente).`);
}

run();
