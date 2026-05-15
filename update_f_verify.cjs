const fs = require('fs');

const oldPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2010_ULTIMI_AGGIORNAMENTI.md';
const newPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2025_ULTIMI_AGGIORNAMENTI.md';

let content = fs.readFileSync(oldPath, 'utf8');

const newEntry = `
**14/05/2026 20:25 — F1-018 Completato (AG F1) - VERIFICA OPERATIVA Backend MC1+MC2+MC3**
- **Azione:** Eseguiti test automatizzati DB e API (in Node/cURL) per verificare la reale operatività del Backend post-Fase A.
- **Risultato:** Isolati 3 bug che causavano HTTP 500. Il server è regolarmente in ascolto.
- **Dettagli Bug Segnalati:**
  1) \`attachments_url\` mancante in tabella \`members\` (causa crash 500 su endpoint dossier).
  2) Disallineamento naming Drizzle in \`mc3_pagamenti.ts\` (snake_case vs camelCase su \`business_name\`), che blocca le POST di society e payer.
  3) Mancanza endpoint \`/api/health\`.
- **Note Operative:** ZERO PATCH eseguite come da direttiva conservativa. È stato solo generato un report per Gaetano in attesa di autorizzazione per fix.
- **Stato:** Test Completati e Diagnosticati. In attesa di Stop & Go.
`;

// Sostituisci timestamp in header
content = content.replace(/aggiornato: 2026-05-14T20:10/, 'aggiornato: 2026-05-14T20:25');
content = content.replace(/ultima_verifica_vs_codice: 2026-05-14T20:10/, 'ultima_verifica_vs_codice: 2026-05-14T20:25');
content = content.replace(/> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:10/, '> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:25');

// Inserisci nuova entry dopo "> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:25\n"
content = content.replace(/(> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:25\n)/, `$1\n${newEntry}`);

fs.writeFileSync(newPath, content, 'utf8');
fs.unlinkSync(oldPath);

console.log("Updated F_ file successfully.");
