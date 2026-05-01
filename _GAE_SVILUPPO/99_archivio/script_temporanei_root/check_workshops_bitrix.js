import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

async function main() {
  const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

  const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const headerRow = data[0];
  const colIscrizioniIdx = headerRow.indexOf('codici_corso_iscrizioni');
  const colProveIdx = headerRow.indexOf('codici_corso_prove_e_lezioni');

  let wsSkus = 0;

  for (let i = 1; i < data.length; i++) {
      const iscr = data[i][colIscrizioniIdx];
      const prov = data[i][colProveIdx];
      
      const allSkus = [];
      if (iscr && typeof iscr === 'string') {
          allSkus.push(...iscr.split(',').map(s => s.trim()).filter(s => s.length > 0));
      }
      if (prov && typeof prov === 'string') {
          allSkus.push(...prov.split(',').map(s => s.trim()).filter(s => s.length > 0));
      }

      for (let rawSku of allSkus) {
          if (rawSku.toUpperCase().includes('WS')) {
              wsSkus++;
          }
      }
  }

  console.log(`Workshop SKUs found in Bitrix: ${wsSkus}`);

  await connection.end();
}
main().catch(console.error);
