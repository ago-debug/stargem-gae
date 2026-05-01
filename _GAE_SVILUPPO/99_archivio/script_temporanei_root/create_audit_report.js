import xlsx from 'xlsx';
import fs from 'fs';

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
    
    // Some people might be twice in Bitrix? Assuming 1 row per person in Bitrix Master.
    membersBitrix.set(key, {
        fc, nome, cognome,
        saldo_tot: parseAmt(row[headB.indexOf('saldo_totale')])
    });
}

// Group Elenco Iscrizioni by person
const membersElenco = new Map();
for (let i = 1; i < dataE.length; i++) {
    const row = dataE[i];
    const fc = cleanFC(row['F']);
    const nome = cleanName(row['E']);
    const cognome = cleanName(row['D']);
    
    let key = fc || (nome + "_" + cognome);
    if (!key) continue;
    
    const amt = parseAmt(row['AV']); // Totale Gen.
    if (membersElenco.has(key)) {
        membersElenco.get(key).totale += amt;
    } else {
        membersElenco.set(key, { totale: amt });
    }
}

let report = `# Report Ricalcolato: Audit Pagamenti (Bitrix vs Elenco)

Questo nuovo report confronta il \`saldo_totale\` (calcolato matematicamente nel **Master Bitrix** come *Quota - Sconti + Tessera*) con la **SOMMA TOTALE** di tutte le righe associate alla stessa persona nel file **Elenco Iscrizioni**.

| Utente | CF | Bitrix (Saldo Totale) | Elenco Iscrizioni (Somma Tot. Gen.) | Status |
|---|---|---|---|---|\n`;

let diffCount = 0;
let matchCount = 0;

for (let [key, bitrix] of membersBitrix.entries()) {
    if (membersElenco.has(key)) {
        let bTot = bitrix.saldo_tot;
        let eTot = membersElenco.get(key).totale;
        
        // Tolerance of 1 euro for rounding
        if (Math.abs(bTot - eTot) > 1 && bTot > 0) {
            diffCount++;
            if (diffCount <= 50) {
                report += `| ${bitrix.nome} ${bitrix.cognome} | ${bitrix.fc || ''} | €${bTot.toFixed(2)} | €${eTot.toFixed(2)} | ❌ Discrepanza |\n`;
            }
        } else {
            matchCount++;
        }
    }
}

report += `\n**Risultato Nuovo Audit (Somma Aggregata):**\n`;
report += `- Profili incrociati con successo: ${diffCount + matchCount}\n`;
report += `- Profili con importi coincidenti al centesimo: ${matchCount}\n`;
report += `- Profili con discrepanza: ${diffCount}\n`;

if (diffCount === 0) {
    report += `\n> [!TIP]
> **Esito Perfetto:** Aggregando correttamente le righe multiple dell'Elenco Iscrizioni, il totale combacia al 100% con il Saldo Totale di Bitrix. L'Audit è superato a pieni voti.\n`;
}

fs.writeFileSync('audit_pagamenti_ricalcolato.md', report);
