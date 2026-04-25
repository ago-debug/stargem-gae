#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO 1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -in "duplica\|duplicate\|copy\|clone\|copia" server/routes.ts | head -30
echo "---"
grep -in -A 60 "app\.post.*duplica\|app\.post.*copy\|app\.post.*clone" server/routes.ts | head -80

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO 2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -in "sku\|generateSku\|buildSku\|\.D\|\.F\|\.X" server/routes.ts server/storage.ts | head -30

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO 4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -in "strategic-events\|strategic_events\|holiday\|festiv" server/routes.ts | head -20

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BLOCCO 5"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL' > query_b5.js
import 'dotenv/config';
import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("SHOW COLUMNS FROM courses;");
  const res1 = await db.execute(sql`SHOW COLUMNS FROM courses`);
  console.table(res1[0] || res1);

  console.log("\ninformation_schema.columns:");
  const res2 = await db.execute(sql`
SELECT column_name FROM information_schema.columns
WHERE table_schema='stargem_v2' 
  AND table_name='courses'
  AND (column_name LIKE '%occurr%' 
   OR column_name LIKE '%count%'
   OR column_name LIKE '%repeat%'
   OR column_name LIKE '%settiman%');
  `);
  console.table(res2[0] || res2);
  process.exit(0);
}
run().catch(console.error);
SQL
npx tsx query_b5.js
