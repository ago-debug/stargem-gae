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

    const wb2 = xlsx.readFile('temp_import/estrap_20260316_estrapolazione_ISCRITTI WORKSHOP.xlsx');
    const data2 = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1 });
    
    let added = 0;
    let totalAmt = 0;

    for (let i = 1; i < data2.length; i++) {
        const row = data2[i];
        let fc = row[9] ? String(row[9]).trim().toUpperCase() : null;
        if (!fc) continue;
        
        let memberId = memberByFC.get(fc);
        if (!memberId) continue;

        const amt = parseAmt(row[14]);
        if (amt > 0) {
            const date = parseDate(row[11]);
            const typeStr = row[15] || '';
            const labels = ['WORKSHOP', row[13]].filter(Boolean);
            
            await connection.execute(
                `INSERT INTO payments (amount, paid_date, status, type, member_id, description, payment_note_labels) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [amt, date, 'paid', 'workshop', memberId, `Quota Workshop: ${typeStr}`, JSON.stringify(labels)]
            );
            added++;
            totalAmt += amt;
        }
    }
    
    console.log(`Successfully added ${added} Workshop payments! Total Value: €${totalAmt.toFixed(2)}`);
    await connection.end();
}
main().catch(console.error);
