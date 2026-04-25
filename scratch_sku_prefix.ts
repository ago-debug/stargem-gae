import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { db } from './server/db';
import { courses } from './shared/schema';
import { isNotNull } from 'drizzle-orm';

async function run() {
  const buf = fs.readFileSync(
    'temp_import/estrap_20260415_ElencoIscrizioni.xlsx'
  );
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets['ElencoIscrizioni'];
  const rows = XLSX.utils.sheet_to_json(
    ws, { defval: null }
  ) as any[];

  const skuSet = new Set(
    rows.map(r => r['Sigla'])
      .filter(Boolean)
      .map(s => String(s).trim())
  );

  const dbCourses = await db.select({
    id: courses.id,
    sku: courses.sku,
    name: courses.name
  }).from(courses)
    .where(isNotNull(courses.sku));

  let exactMatch = 0;
  let prefixMatch = 0;
  let noMatch = 0;
  let multipleMatch = 0;

  for (const sku of skuSet) {
    // Exact
    const exact = dbCourses.filter(
      c => c.sku === sku
    );
    if (exact.length > 0) {
      exactMatch++;
      continue;
    }
    // Prefix
    const prefix = dbCourses.filter(
      c => c.sku?.startsWith(sku)
    );
    if (prefix.length === 1) {
      prefixMatch++;
    } else if (prefix.length > 1) {
      multipleMatch++;
      console.log('MULTIPLO:', sku,
        prefix.map(c => c.sku));
    } else {
      noMatch++;
      console.log('NOMATCH:', sku);
    }
  }

  console.log('\n=== RISULTATO ===');
  console.log('SKU unici nel file:', skuSet.size);
  console.log('Match esatto:', exactMatch);
  console.log('Match prefisso (1):', prefixMatch);
  console.log('Match prefisso (multiplo):',
    multipleMatch);
  console.log('Nessun match:', noMatch);
  process.exit(0);
}
run();
