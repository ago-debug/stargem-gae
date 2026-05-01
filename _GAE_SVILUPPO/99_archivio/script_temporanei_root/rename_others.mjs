import fs from 'fs';

const files = [
  '_GAE_SVILUPPO/F_2026_04_27_1300_ULTIMI_AGGIORNAMENTI.md',
  '_GAE_SVILUPPO/G_2026_04_27_1300_Checklist_Operativa.md',
  '_GAE_SVILUPPO/futuro/E_2026_04_27_1300_Espansione_CRM.md'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  const newPath = file.replace('2026_04_27_1300', '2026_04_28_1150');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('Aggiornato al: 2026-04-27 13:00', 'Aggiornato al: 2026-04-28 11:50');
  
  // also replace any mention of D2 or D3
  content = content.replace(/D2_.*?\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  content = content.replace(/D3_.*?\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  content = content.replace(/D_2026_04_27_1300_Stato_DB_Reale\.md/g, 'D_2026_04_28_1150_Mappa_Dati_e_Frontend.md');
  
  fs.writeFileSync(newPath, content);
  if (file !== newPath) {
    fs.unlinkSync(file);
  }
}
console.log('Rinominati F, G, E');
