import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
  
  const [tables] = await connection.execute("SHOW TABLES;");
  let md = "# 📊 STATO DB REALE — MAPPATURA COMPLETA\n\n";
  md += "Data di generazione: " + new Date().toISOString() + "\n\n";
  md += "Questo documento contiene la mappatura esatta di tutte le tabelle, colonne e tipi di dati attualmente presenti nel database di produzione.\n\n";
  
  for (const tRow of tables) {
    const tableName = Object.values(tRow)[0];
    md += `## Tabella: \`${tableName}\`\n\n`;
    
    const [cols] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\`;`);
    const [countRes] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\`;`);
    
    md += `**Record Totali:** ${countRes[0].cnt}\n\n`;
    md += "| Colonna | Tipo | Null | Chiave | Default | Extra |\n";
    md += "| --- | --- | --- | --- | --- | --- |\n";
    
    for (const c of cols) {
      md += `| \`${c.Field}\` | \`${c.Type}\` | ${c.Null} | ${c.Key} | ${c.Default || 'NULL'} | ${c.Extra} |\n`;
    }
    md += "\n";
  }

  fs.writeFileSync('_GAE_SVILUPPO/attuale/D_2026_04_28_0950_Stato_DB_Reale.md', md);
  console.log("Document generated: _GAE_SVILUPPO/attuale/D_2026_04_28_0950_Stato_DB_Reale.md");
  await connection.end();
}
main().catch(console.error);
