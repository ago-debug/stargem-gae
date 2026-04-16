import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import xlsx from 'xlsx';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const propCost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + propCost
      );
    }
  }
  return matrix[b.length][a.length];
}

async function main() {
  console.log(`Starting CF Typo Finder (dry-run: ${isDryRun})`);

  // Trova coppie
  // Abbiamo bisogno di combinazioni. Per essere performanti potremmo leggere tutto e incrociare 
  // group by email o group by nome+cognome.
  
  const membersByEmail = await db.execute(sql`
    SELECT id, first_name, last_name, fiscal_code, email, phone, mobile, date_of_birth, place_of_birth, address, city, postal_code, province, nationality, region, birth_nation, secondary_email, privacy_date, consent_newsletter, notes, tutor1_fiscal_code, internal_id, insertion_date
    FROM members 
    WHERE active = 1 AND fiscal_code IS NOT NULL AND fiscal_code != '' AND email IS NOT NULL AND email != ''
  `);

  const groupsByEmail = new Map<string, any[]>();
  for (const m of (membersByEmail[0] as any[])) {
    const e = m.email.toLowerCase().trim();
    if (!groupsByEmail.has(e)) groupsByEmail.set(e, []);
    groupsByEmail.get(e)!.push(m);
  }

  const membersByName = await db.execute(sql`
    SELECT id, first_name, last_name, fiscal_code, email, phone, mobile, date_of_birth, place_of_birth, address, city, postal_code, province, nationality, region, birth_nation, secondary_email, privacy_date, consent_newsletter, notes, tutor1_fiscal_code, internal_id, insertion_date
    FROM members 
    WHERE active = 1 AND fiscal_code IS NOT NULL AND fiscal_code != '' AND first_name IS NOT NULL AND last_name IS NOT NULL
  `);

  const groupsByName = new Map<string, any[]>();
  for (const m of (membersByName[0] as any[])) {
    const n = (m.first_name + '|' + m.last_name).toLowerCase().trim();
    if (!groupsByName.has(n)) groupsByName.set(n, []);
    groupsByName.get(n)!.push(m);
  }

  const reports: any[] = [];
  const processedPairs = new Set<string>();

  const processPair = (m1: any, m2: any, reason: string) => {
    if (m1.id === m2.id) return;
    const pairKey = [m1.id, m2.id].sort((a,b)=>a-b).join('-');
    if (processedPairs.has(pairKey)) return;
    processedPairs.add(pairKey);

    const dist = levenshtein(m1.fiscal_code, m2.fiscal_code);
    if (dist > 0 && dist <= 2) {
      reports.push({ m1, m2, dist, reason });
    }
  };

  for (const group of groupsByEmail.values()) {
    if (group.length > 1) {
      for (let i=0; i<group.length; i++) {
        for (let j=i+1; j<group.length; j++) {
          processPair(group[i], group[j], 'email');
        }
      }
    }
  }

  for (const group of groupsByName.values()) {
    if (group.length > 1) {
      for (let i=0; i<group.length; i++) {
        for (let j=i+1; j<group.length; j++) {
          processPair(group[i], group[j], 'nome_cognome');
        }
      }
    }
  }

  // LETTURA EXCEL per reference check
  let athenaCFs = new Set<string>();
  let masterCFs = new Set<string>();
  try {
     const wbA = xlsx.read(fs.readFileSync('temp_import/estrap_20260415_AnaPersoneFullExcel.xlsx'), { cellDates: true });
     const rowsA = xlsx.utils.sheet_to_json<any>(wbA.Sheets[wbA.SheetNames[0]]);
     for (const r of rowsA) {
       if (r['Cod. Fiscale']) athenaCFs.add(r['Cod. Fiscale'].toUpperCase().trim());
     }
  } catch(e) { console.error("Athena xls skip"); }

  try {
     const wbM = xlsx.read(fs.readFileSync('temp_import/estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx'), { cellDates: true });
     const rowsM = xlsx.utils.sheet_to_json<any>(wbM.Sheets[wbM.SheetNames[0]]);
     for (const r of rowsM) {
       if (r['an_cod_fiscale']) masterCFs.add(r['an_cod_fiscale'].toUpperCase().trim());
     }
  } catch(e) { console.error("Master xls skip"); }

  const SCORING_FIELDS = [
    'email', 'phone', 'mobile', 'fiscal_code', 'date_of_birth', 'place_of_birth',
    'address', 'city', 'postal_code', 'province', 'nationality', 'region',
    'birth_nation', 'secondary_email', 'privacy_date', 'consent_newsletter',
    'notes', 'tutor1_fiscal_code', 'internal_id', 'insertion_date'
  ];

  const getScore = (m: any) => {
    let s = 0;
    for(const f of SCORING_FIELDS) {
      if (m[f] !== null && m[f] !== undefined && m[f] !== '') s++;
    }
    return s;
  };

  const finalReports = [];
  let athenaConfirmed = 0;
  let scoreDecided = 0;
  let noteUpdatesCount = 0;

  for (const r of reports) {
    const s1 = getScore(r.m1);
    const s2 = getScore(r.m2);
    
    let w = null;
    let l = null;
    let fonte = '';

    const cf1 = r.m1.fiscal_code.toUpperCase().trim();
    const cf2 = r.m2.fiscal_code.toUpperCase().trim();

    const inAth1 = athenaCFs.has(cf1);
    const inAth2 = athenaCFs.has(cf2);

    if (inAth1 && !inAth2) { w = r.m1; l = r.m2; fonte = 'athena'; athenaConfirmed++; }
    else if (!inAth1 && inAth2) { w = r.m2; l = r.m1; fonte = 'athena'; athenaConfirmed++; }
    else {
      const inMas1 = masterCFs.has(cf1);
      const inMas2 = masterCFs.has(cf2);
      if (inMas1 && !inMas2) { w = r.m1; l = r.m2; fonte = 'gsheets'; }
      else if (!inMas1 && inMas2) { w = r.m2; l = r.m1; fonte = 'gsheets'; }
      else {
        if (s1 > s2) { w = r.m1; l = r.m2; fonte = 'score'; scoreDecided++; }
        else if (s2 > s1) { w = r.m2; l = r.m1; fonte = 'score'; scoreDecided++; }
        else {
           if (r.m1.id < r.m2.id) { w = r.m1; l = r.m2; fonte = 'score'; scoreDecided++; }
           else { w = r.m2; l = r.m1; fonte = 'score'; scoreDecided++; }
        }
      }
    }

    finalReports.push({
       id_winner: w.id,
       cf_winner: w.fiscal_code,
       nome_winner: w.first_name + ' ' + w.last_name,
       score_winner: getScore(w),
       fonte_winner: fonte,
       id_loser: l.id,
       cf_loser: l.fiscal_code,
       nome_loser: l.first_name + ' ' + l.last_name,
       score_loser: getScore(l),
       edit_distance: r.dist,
       match_reason: r.reason,
       azione_consigliata: 'verifica_manuale'
    });

    noteUpdatesCount++;

    if (!isDryRun) {
      const noteStr = ` [CF-DA-VERIFICARE: cf simile a ID ${w.id} cf=${w.fiscal_code} dist=${r.dist}]`;
      await db.execute(sql.raw(`UPDATE members SET notes = CONCAT(COALESCE(notes, ''), '${noteStr}') WHERE id = ${l.id}`));
    }
  }

  fs.writeFileSync('/tmp/cf_typo_report.json', JSON.stringify(finalReports, null, 2));

  console.log(`Coppie CF simili trovate: ${finalReports.length}`);
  console.log(`Di cui con fonte Athena confermata: ${athenaConfirmed}`);
  console.log(`Di cui solo per score: ${scoreDecided}`);
  console.log(`Note aggiunte in DB (dry-run): ${noteUpdatesCount}`);
  
  process.exit(0);
}

main().catch(console.error);
