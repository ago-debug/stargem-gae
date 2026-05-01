import xlsx from 'xlsx';

const wbE = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const dataE = xlsx.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { header: "A", defval: null });

let sigle = {};
for (let i = 1; i < dataE.length; i++) {
    const row = dataE[i];
    const sigla = String(row['AG'] || '').trim().toUpperCase();
    if (sigla) {
        sigle[sigla] = (sigle[sigla] || 0) + 1;
    }
}

// Now filter those that map to 'storico' in DB
import mysql from 'mysql2/promise';
async function main() {
    const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');
    const [courses] = await connection.execute("SELECT sku, activity_type FROM courses WHERE activity_type = 'storico'");
    const storicoSkus = new Set(courses.map(c => c.sku.toUpperCase()));
    
    let sum = 0;
    for(let k in sigle) {
        let clean = k.includes('.') ? k.split('.')[0] : k;
        if(storicoSkus.has(clean)) {
            console.log(`Sigla: ${k}, count: ${sigle[k]}`);
            sum += sigle[k];
        }
    }
    console.log("Total storico from Elenco:", sum);
    await connection.end();
}
main().catch(console.error);
