import fs from 'fs';

let fContent = fs.readFileSync('_GAE_SVILUPPO/F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md', 'utf8');
const fNewEntry = `
### Aggiornamento 28/04/2026 (Chat_24_DB_Monitor)
- **Audit Completato:** F1-001 (Backend) e F2-001 (Frontend) sul monitoraggio DB e UI in tempo reale.
- **Decisioni architetturali (Approvate):**
  - **Cattura modifiche AG:** Strategia IBRIDA (wrapper DB Pool + tentativo lettura binary log se IONOS lo permette, con fallback al wrapper puro).
  - **Mappa Frontend↔DB:** Strategia IBRIDA (\`db-map-config.ts\` statico in RAM per lo schema + script di verifica notturna asincrona per non caricare il DB).
  - **Modernizzazioni Fase 1:** Implementazione *Schema Diff* automatico e calcolo *Health Score* per le tabelle.
  - **Modernizzazioni Fase 2:** Integrazione *AI Natural Query* (lettura) e *Command Palette Cmd+K* per l'Admin.
- **Stato Chat_24:** 🟡 IN PAUSA (Ripresa programmata nei tempi morti).
`;
// insert after the period line or at the top
fContent = fContent.replace(/---/, fNewEntry + '\n---');
fs.writeFileSync('_GAE_SVILUPPO/F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md', fContent);

let gContent = fs.readFileSync('_GAE_SVILUPPO/G_2026_04_28_1150_Checklist_Operativa.md', 'utf8');
const gNewEntry = `
## Cruscotto Amministrativo (DB Monitor)
- [ ] Implementazione Cruscotto DB Monitor — **🟡 IN PAUSA** (Chat_24 audit completato, ripresa programmata nei tempi morti).
`;
gContent += gNewEntry;
fs.writeFileSync('_GAE_SVILUPPO/G_2026_04_28_1150_Checklist_Operativa.md', gContent);

console.log("F and G updated.");
