const fs = require('fs');

const oldPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2035_ULTIMI_AGGIORNAMENTI.md';
const newPath = '_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_2026_05_14_2045_ULTIMI_AGGIORNAMENTI.md';

let content = fs.readFileSync(oldPath, 'utf8');

const newEntry = `
**14/05/2026 20:45 — F1-020 Completato (AG F1) - VERIFICA Modulo Importa e Decision Pack Lotto 1**
- **Azione:** Effettuata ispezione Read-Only (Zero Patch) del modulo importatore CSV/Zod post refactoring F1-019. Analizzati i file \`client/src/pages/import-data.tsx\` e le routes backend \`/api/import/mapped\`.
- **Dettaglio:** Strutturata analisi di compatibilità tra le attuali policies del DB e le logiche di Import pre-esistenti. Verificato il livello di flessibilità (Strada A vs B vs A+B).
- **Rilievi Bloccanti Segnalati:** Il sistema allo stato attuale applica blocchi di livello "Fatal" scartando intere tuple (record) per la sola assenza del Codice Fiscale, una condizione ritenuta ad alto rischio per i database legacy (come Athena) spesso frammentari.
- **Validazione:** Generato report formale per Gaetano contenente le domande di sblocco operativo e le raccomandazioni tecniche (suggerita "Strada B" con downgrade del check Codice Fiscale a Warning). Nessun file sorgente alterato.
- **Stato:** Diagnosi completata. Attesa per il Go Live del Lotto 1 post-conferma parametri Athena.
`;

// Sostituisci timestamp in header
content = content.replace(/aggiornato: 2026-05-14T20:35/, 'aggiornato: 2026-05-14T20:45');
content = content.replace(/ultima_verifica_vs_codice: 2026-05-14T20:35/, 'ultima_verifica_vs_codice: 2026-05-14T20:45');
content = content.replace(/> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:35/, '> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:45');

// Inserisci nuova entry dopo "> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:45\n"
content = content.replace(/(> \*\*Ultimo Aggiornamento:\*\* 14 Maggio 2026, 20:45\n)/, `$1\n${newEntry}`);

fs.writeFileSync(newPath, content, 'utf8');
fs.unlinkSync(oldPath);

console.log("Updated F_ file successfully.");
