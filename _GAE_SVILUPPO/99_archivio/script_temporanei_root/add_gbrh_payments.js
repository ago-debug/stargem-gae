import mysql from 'mysql2/promise';
import xlsx from 'xlsx';

function parseAmt(val) {
    if (!val) return 0;
    const s = String(val).replace('€', '').replace(/\s/g, '').replace(',', '.');
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
}
function parseDate(val) {
    if (!val) return new Date('2026-01-01');
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569)*86400*1000));
        return isNaN(d.getTime()) ? new Date('2026-01-01') : d;
    }
    const str = String(val).trim();
    const parts = str.split('/');
    if(parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return new Date('2026-01-01');
}

async function main() {
    const connection = await mysql.createConnection('mysql://gaetano_admin:Verona2026stargem2026@127.0.0.1:3307/stargem_v2');

    const [dbMembers] = await connection.execute(`SELECT id, fiscal_code FROM members WHERE fiscal_code IS NOT NULL`);
    const memberByFC = new Map();
    dbMembers.forEach(m => memberByFC.set(m.fiscal_code.trim().toUpperCase(), m.id));

    const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
    const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
    
    let added = 0;
    let totalAmt = 0;

    for (let row of data) {
        let fc = row['codice_fiscale_fatturazione'] || row['codice_fiscale_non_presente_in_athena'];
        fc = fc ? String(fc).trim().toUpperCase() : null;
        if (!fc) continue;
        
        let memberId = memberByFC.get(fc);
        if (!memberId) continue;

        const amt = parseAmt(row['gbrh_valore_importo']);
        if (amt > 0) {
            const date = parseDate(row['gbrh_data_pag_quad_']);
            const typeStr = row['gbrh_tipo'] || '';
            const labels = ['BUONO_REGALO', typeStr].filter(Boolean);
            
            await connection.execute(
                `INSERT INTO payments (amount, paid_date, status, type, member_id, description, payment_note_labels) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [amt, date, 'paid', 'buono_regalo', memberId, `Pagamento Buono Regalo: ${typeStr}`, JSON.stringify(labels)]
            );
            added++;
            totalAmt += amt;
        }
    }
    
    console.log(`Successfully added ${added} GBRH payments! Total Value: €${totalAmt.toFixed(2)}`);
    await connection.end();
}
main().catch(console.error);
