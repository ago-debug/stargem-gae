import xlsx from 'xlsx';
import mysql from 'mysql2/promise';

function cleanFC(fc) {
    return fc ? String(fc).trim().toUpperCase() : null;
}
function cleanName(n) {
    return n ? String(n).trim().toUpperCase() : null;
}
function parseAmt(val) {
    if (!val) return 0;
    const s = String(val).replace('€', '').replace(/\s/g, '').replace(',', '.');
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
}

async function main() {
    console.log("Connecting to DB to flag discrepancies...");
    const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

    const wbB = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
    const dataB = xlsx.utils.sheet_to_json(wbB.Sheets[wbB.SheetNames[0]], { header: 1 });
    const headB = dataB[0];

    const wbE = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
    const dataE = xlsx.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { header: "A", defval: null });

    const membersBitrix = new Map();

    for (let i = 1; i < dataB.length; i++) {
        const row = dataB[i];
        const fc = cleanFC(row[headB.indexOf('an_cod_fiscale')]);
        const nome = cleanName(row[headB.indexOf('an_nome')]);
        const cognome = cleanName(row[headB.indexOf('an_cognome')]);
        
        let key = fc || (nome + "_" + cognome);
        if (!key) continue;
        
        membersBitrix.set(key, {
            fc, nome, cognome,
            saldo_tot: parseAmt(row[headB.indexOf('saldo_totale')])
        });
    }

    const membersElenco = new Map();
    for (let i = 1; i < dataE.length; i++) {
        const row = dataE[i];
        const fc = cleanFC(row['F']);
        const nome = cleanName(row['E']);
        const cognome = cleanName(row['D']);
        
        let key = fc || (nome + "_" + cognome);
        if (!key) continue;
        
        const amt = parseAmt(row['AV']); 
        if (membersElenco.has(key)) {
            membersElenco.get(key).totale += amt;
        } else {
            membersElenco.set(key, { totale: amt, fc, nome, cognome });
        }
    }

    const fcsToFlag = [];

    for (let [key, bitrix] of membersBitrix.entries()) {
        if (membersElenco.has(key)) {
            let bTot = bitrix.saldo_tot;
            let eTot = membersElenco.get(key).totale;
            
            if (Math.abs(bTot - eTot) > 1 && bTot > 0) {
                if (bitrix.fc) fcsToFlag.push(bitrix.fc);
            }
        }
    }

    console.log(`Found ${fcsToFlag.length} discrepancies to flag.`);
    
    // Clear existing flags
    await connection.execute(`UPDATE members SET data_quality_flag = NULL WHERE data_quality_flag = 'DISCREPANZA_PAGAMENTI'`);
    
    let count = 0;
    for (let fc of fcsToFlag) {
        const [res] = await connection.execute(`UPDATE members SET data_quality_flag = 'DISCREPANZA_PAGAMENTI' WHERE fiscal_code = ?`, [fc]);
        count += res.affectedRows;
    }

    console.log(`Successfully flagged ${count} members in the database!`);
    await connection.end();
}
main().catch(console.error);
