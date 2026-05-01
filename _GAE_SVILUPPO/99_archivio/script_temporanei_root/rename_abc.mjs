import fs from 'fs';

const files = [
  'A_2026_04_27_1300_Architettura_Core_Server.md',
  'B_2026_04_27_1300_Frontend_Moduli.md',
  'C_2026_04_27_1300_Stato_Lavori_e_Briefing.md'
];

for (const file of files) {
  const oldPath = '_GAE_SVILUPPO/attuale/' + file;
  const newPath = oldPath.replace('2026_04_27_1300', '2026_04_28_1150');
  
  let content = fs.readFileSync(oldPath, 'utf8');
  content = content.replace('Aggiornato al: 2026-04-27 13:00', 'Aggiornato al: 2026-04-28 11:50');
  
  // also replace any mention of D2 or D3
  content = content.replace(/D2_.*?\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  content = content.replace(/D3_.*?\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  content = content.replace(/D_2026_04_27_1300_Stato_DB_Reale\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  
  fs.writeFileSync(newPath, content);
  if (oldPath !== newPath) {
    fs.unlinkSync(oldPath);
  }
}
console.log('Rinominati A, B, C');
