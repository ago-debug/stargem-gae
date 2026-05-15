const fs = require('fs');

const oldPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2045_ULTIMI_AGGIORNAMENTI.md';
const newPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_15_1025_ULTIMI_AGGIORNAMENTI.md';

let content = fs.readFileSync(oldPath, 'utf8');

const newEntry = `
**15/05/2026 10:25 — F1-022 Completato (AG F1) - FIX Bug E2E Stepper UI (MC2 Backend)**
- **Azione:** Patching del database su \`dossier_steps\` e fix architetturale del modulo di upload in \`server/routes.ts\`.
- **Dettaglio:** 
  1. Alterato \`completed_by\` da \`INT\` a \`VARCHAR(255)\` risolvendo il crash "500 ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" che impediva il progresso da Step 1 a Step 2.
  2. Implementata strategia di rilocazione dinamica post-Multer per risolvere il bug della cartella "unknown". Ora l'upload previene il disallineamento \`404 ENOENT\` tra DB URL e File System.
- **Validazione:** Test REST effettuati positivamente. Generato report F1-022.
- **Stato:** Backend MC2 in stabilità operativa (Stop & Go).
`;

// Sostituisci timestamp in header
content = content.replace(/aggiornato: 2026-05-14T20:45/, 'aggiornato: 2026-05-15T10:25');
content = content.replace(/ultima_verifica_vs_codice: 2026-05-14T20:45/, 'ultima_verifica_vs_codice: 2026-05-15T10:25');
content = content.replace(/> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:45/, '> **Ultimo Aggiornamento:** 15 Maggio 2026, 10:25');

// Inserisci nuova entry dopo "> **Ultimo Aggiornamento:** 15 Maggio 2026, 10:25\n"
content = content.replace(/(> \*\*Ultimo Aggiornamento:\*\* 15 Maggio 2026, 10:25\n)/, `$1\n${newEntry}`);

fs.writeFileSync(newPath, content, 'utf8');
fs.unlinkSync(oldPath);

console.log("Updated F_ file successfully.");
