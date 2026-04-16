import * as xlsx from 'xlsx';
import fs from 'fs';

if (!fs.existsSync('temp_import')) {
  fs.mkdirSync('temp_import');
}

const masterData = [
  { an_cod_fiscale: 'RSSMRA80A01H501U', an_nome: 'Mario', an_cognome: 'Rossi', an_email: 'mario@example.com', an_telefono: '12345', an_sesso: 'M', an_data_inserimento: '2020-01-01', an_id_anagrafica: '1', n_tessera: 'T001' },
  { an_cod_fiscale: 'VRDLGI70B02H501V', an_nome: 'Luigi', an_cognome: 'Verdi', an_email: 'luigi@example.com', an_telefono: '67890', an_sesso: 'M', an_data_inserimento: '2020-01-02', an_id_anagrafica: '2', n_tessera: 'T002' }
];

const ws1 = xlsx.utils.json_to_sheet(masterData);
const wb1 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb1, ws1, 'importazione');
xlsx.writeFile(wb1, 'temp_import/estrap_20260315_estrapolazione_Master_per_importazione_Bitrix.xlsx');

const athenaData = [
  { 'Cod. Fiscale': 'RSSMRA80A01H501U', 'Cognome': 'Rossi', 'Nome': 'Mario', 'Sesso': 'M', 'Data di Nascita': '1980-01-01', 'Città Nasc.': 'Roma', 'Prov. Nasc': 'RM', 'Indirizzo': 'Via Roma 1', 'CAP': '00100', 'Citta Resid.': 'Roma', 'Provincia': 'RM', 'Codice': '444' }
];
const ws2 = xlsx.utils.json_to_sheet(athenaData);
const wb2 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb2, ws2, 'AnaPersoneFullExcel');
xlsx.writeFile(wb2, 'temp_import/estrap_20260415_AnaPersoneFullExcel.xlsx');

const iscrData = [
  { 'Cod. Fisc.': 'RSSMRA80A01H501U', 'Tessera': 'T001', 'Scad. Tessera': '2024-12-31', 'Matricola': 'M001' }
];
const ws3 = xlsx.utils.json_to_sheet(iscrData);
const wb3 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb3, ws3, 'ElencoIscrizioni');
xlsx.writeFile(wb3, 'temp_import/estrap_20260415_ElencoIscrizioni.xlsx');

console.log("Dummy files created.");
