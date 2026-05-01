import xlsx from 'xlsx';

const wb = xlsx.readFile('temp_import/estrap_20260417_estrapolazione_Master_per_importazione_Bitrix.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const head = data[0];
const idx = {
    sz1_tot: head.indexOf('sz1_totale_quota'),
    sz1_sal: head.indexOf('sz1_saldo\nannuale') !== -1 ? head.indexOf('sz1_saldo\nannuale') : head.indexOf('sz1_saldo'),
    saldo_tot: head.indexOf('saldo_totale'),
    nome: head.indexOf('an_nome'),
    cognome: head.indexOf('an_cognome')
};

for(let i=1; i<20; i++) {
    const row = data[i];
    if (row[idx.sz1_tot] || row[idx.saldo_tot]) {
        console.log(`${row[idx.nome]} ${row[idx.cognome]} | sz1_tot: ${row[idx.sz1_tot]} | saldo_tot: ${row[idx.saldo_tot]}`);
    }
}
