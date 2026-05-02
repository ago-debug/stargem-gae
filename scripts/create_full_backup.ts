import { db } from "../server/db";
import * as schema from "../shared/schema";
import fs from "fs";
import path from "path";

async function backup() {
  const backupData: any = {};
  
  const tableNames = Object.keys(schema).filter(key => {
    return schema[key] && typeof schema[key] === 'object' && 'undefined' !== typeof (schema[key] as any)[Symbol.for('drizzle:Name')];
  });

  console.log(`Trovate ${tableNames.length} tabelle. Inizio backup JSON...`);

  for (const tableName of tableNames) {
    try {
      const table = (schema as any)[tableName];
      const data = await db.select().from(table);
      backupData[tableName] = data;
      console.log(`✅ Tabella ${tableName} salvata: ${data.length} righe.`);
    } catch (e) {
      console.log(`⚠️ Tabella ${tableName} ignorata (probabilmente non è una tabella valida o errore SQL).`);
    }
  }

  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `stargem_full_backup_${date}.json`;
  const backupPath = path.join(process.cwd(), 'backups', filename);
  
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`\n🎉 Backup JSON completo salvato in: ${backupPath}`);
  
  // Optional: compress to gzip using Node zlib to save space
  const zlib = require('zlib');
  const gzip = zlib.createGzip();
  const inp = fs.createReadStream(backupPath);
  const out = fs.createWriteStream(backupPath + '.gz');
  inp.pipe(gzip).pipe(out).on('finish', () => {
    console.log(`📦 Compressione completata: ${filename}.gz`);
    fs.unlinkSync(backupPath); // remove uncompressed JSON
    process.exit(0);
  });
}

backup();
