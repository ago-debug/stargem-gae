import xlsx from 'xlsx';

const wbE = xlsx.readFile('temp_import/estrap_20260415_ElencoIscrizioni.xlsx');
const dataE = xlsx.utils.sheet_to_json(wbE.Sheets[wbE.SheetNames[0]], { header: "A", defval: null });

for (let i = 1; i < dataE.length; i++) {
    const row = dataE[i];
    const nome = String(row['E'] || '').trim().toUpperCase();
    const cognome = String(row['D'] || '').trim().toUpperCase();
    
    if (nome === 'VALENTINA' && cognome === 'CIFARELLI') {
        console.log("Elenco Iscrizioni per VALENTINA CIFARELLI:");
        console.log(`Totale Iscri. (AM): ${row['AM']}`);
        console.log(`Sconti (AS): ${row['AS']}`);
        console.log(`Totale Gen. (AV): ${row['AV']}`);
        console.log(`Tot. Incassato (AU): ${row['AU']}`);
        console.log(`Quota Tessera (BA/AZ): ${row['AZ']} / ${row['BA']}`);
    }
}
