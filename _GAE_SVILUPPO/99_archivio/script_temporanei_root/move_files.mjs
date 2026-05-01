import fs from 'fs';
import path from 'path';

const dirsToMake = [
  '01_canonici', '02_moduli_analisi', '03_recap_chat',
  '04_per_antigravity', '05_da_antigravity', '06_codice_in_lettura', '99_archivio'
];

for (const d of dirsToMake) {
  fs.mkdirSync(`_GAE_SVILUPPO/${d}`, { recursive: true });
}

fs.writeFileSync('_GAE_SVILUPPO/01_canonici/.gitkeep', '');

const moves = [
  { src: '_GAE_SVILUPPO/attuale/A_2026_04_28_1150_Architettura_Core_Server.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/A_2026_04_28_1150_Architettura_Core_Server.md' },
  { src: '_GAE_SVILUPPO/attuale/B_2026_04_28_1150_Frontend_Moduli.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/B_2026_04_28_1150_Frontend_Moduli.md' },
  { src: '_GAE_SVILUPPO/attuale/C_2026_04_28_1150_Stato_Lavori_e_Briefing.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/C_2026_04_28_1150_Stato_Lavori_e_Briefing.md' },
  { src: '_GAE_SVILUPPO/attuale/D_2026_04_28_1150_Mappa_Dati_e_Frontend.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/D_2026_04_28_1150_Mappa_Dati_e_Frontend.md' },
  { src: '_GAE_SVILUPPO/futuro/E_2026_04_28_1150_Espansione_CRM.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/E_2026_04_28_1150_Espansione_CRM.md' },
  { src: '_GAE_SVILUPPO/F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md' },
  { src: '_GAE_SVILUPPO/G_2026_04_28_1150_Checklist_Operativa.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/G_2026_04_28_1150_Checklist_Operativa.md' },
  { src: '_GAE_SVILUPPO/Z_2026_04_28_1300_REPORT_CLEANUP_DB.md', dest: '_GAE_SVILUPPO/02_moduli_analisi/Z_2026_04_28_1300_REPORT_CLEANUP_DB.md' },
];

for (const m of moves) {
  if (fs.existsSync(m.src)) {
    fs.renameSync(m.src, m.dest);
  }
}

try { fs.unlinkSync('_GAE_SVILUPPO/attuale/.DS_Store'); } catch(e) {}
try { fs.unlinkSync('_GAE_SVILUPPO/futuro/.DS_Store'); } catch(e) {}

try { fs.rmdirSync('_GAE_SVILUPPO/attuale'); } catch(e) { console.error('attuale:', e); }
try { fs.rmdirSync('_GAE_SVILUPPO/futuro'); } catch(e) { console.error('futuro:', e); }

console.log("Done moving.");
