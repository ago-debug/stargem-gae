const fs = require('fs');

const oldPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2001_ULTIMI_AGGIORNAMENTI.md';
const newPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2010_ULTIMI_AGGIORNAMENTI.md';

let content = fs.readFileSync(oldPath, 'utf8');

const newEntry = `
**14/05/2026 20:10 — F1-017 Completato (AG F1) - MC3 Pagamenti Relazionali BACKEND Fase A ESECUZIONE**
- **Azione:** Strutturato ed eseguito schema database, file migration e backend endpoints completi per la logica dei Pagamenti Relazionali MC3.
- **Modifiche:**
  1) Creata ed applicata migration raw SQL in \`migrations/_mc3_pagamenti_relazionali.sql\` e aggiornato \`shared/schema.ts\` con entità \`external_payers\`, \`societies\` e \`payment_participants\`. Aggiunti nuovi field relazionali a \`payments\`.
  2) Scritti endpoints CRUD completi per le nuove entità in \`server/routes/mc3_pagamenti.ts\` e aggiunta importazione in \`server/routes.ts\`.
  3) Sviluppato e collaudato nuovo endpoint \`POST /api/payments/multi-participant\` per la gestione unificata di pagamenti per N figli o pagamenti di welfare. Aggiornato logica storici pagamenti membri per includere payment_participants.
  4) Aggiunto \`documentType.ts\` in utils per la definizione intelligente di Fattura vs Ricevuta.
  5) Fixati errori di compilazione TS inclusi fix secondari in \`AnagraficaStep.tsx\`.
- **Validazione:** \`npx tsc --noEmit\` completato con codice **0**. Effettuati test runtime con emulazione CURL e report salvato.
- **Stato:** Fase A (Backend) completata in autonomia con Express Mode. In attesa di Fase B per allineamento Frontend (Stepper / Checkout).
`;

// Sostituisci timestamp in header
content = content.replace(/aggiornato: 2026-05-14T20:01/, 'aggiornato: 2026-05-14T20:10');
content = content.replace(/ultima_verifica_vs_codice: 2026-05-14T20:01/, 'ultima_verifica_vs_codice: 2026-05-14T20:10');
content = content.replace(/> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:01/, '> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:10');

// Inserisci nuova entry dopo "> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:10\n"
content = content.replace(/(> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:10\n)/, `$1\n${newEntry}`);

fs.writeFileSync(newPath, content, 'utf8');
fs.unlinkSync(oldPath);

console.log("Updated F_ file successfully.");
