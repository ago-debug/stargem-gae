const fs = require('fs');

// 1. Fix GAE_Checklist_Operativa.md
let checklist = fs.readFileSync('_GAE_SVILUPPO/GAE_Checklist_Operativa.md', 'utf8');
checklist = checklist.replace(
  "> QUALSIASI MODIFICA O NUOVA FEATURE DEVE ESSERE SVILUPPATA SULLA VECCHIA ARCHITETTURA A 11 SILOS. Non prendere iniziative per l'unificazione senza preavviso.",
  "> **AGGIORNAMENTO OBIETTIVO STI (Single Table Inheritance):** La Fase 1 (Design Esecutivo) è completata e approvata in `18_GAE_STI_Bridge_Plan_Executive.md`. Siamo autorizzati a procedere con la Fase 2 (Creazione Tabelle in Shadow Mode), senza ancora toccare il database in produzione né alterare la UI/Runtime."
);

// Remove the duplicated sentence if it occurred due to the previous partial replace success
checklist = checklist.replace(
  "> **AGGIORNAMENTO OBIETTIVO STI (Single Table Inheritance):** La Fase 1 (Design Esecutivo) è completata e approvata in `18_GAE_STI_Bridge_Plan_Executive.md`. Siamo autorizzati a procedere con la Fase 2 (Creazione Tabelle in Shadow Mode), senza ancora toccare il database in produzione né alterare la UI/Runtime.> **AGGIORNAMENTO OBIETTIVO STI (Single Table Inheritance):** La Fase 1 (Design Esecutivo) è completata e approvata in `18_GAE_STI_Bridge_Plan_Executive.md`. Siamo autorizzati a procedere con la Fase 2 (Creazione Tabelle in Shadow Mode), senza ancora toccare il database in produzione né alterare la UI/Runtime.",
  "> **AGGIORNAMENTO OBIETTIVO STI (Single Table Inheritance):** La Fase 1 (Design Esecutivo) è completata e approvata in `18_GAE_STI_Bridge_Plan_Executive.md`. Siamo autorizzati a procedere con la Fase 2 (Creazione Tabelle in Shadow Mode), senza ancora toccare il database in produzione né alterare la UI/Runtime."
);

const phase2Checklist = `
---
## Fase 12 - STI Fase 2 (Shadow Mode Executive Checklist)
Questa fase è strettamente NON DISTRUTTIVA. Nessuna tabella legacy verrà divisa, nessuna UI o API pubblica interrotta.

- [ ] **Naming definitivo tabelle shadow**:
  - \`activities_unified\`
  - \`enrollments_unified\`
- [ ] **Naming endpoint bridge**:
  - \`GET /api/activities-unified-preview\`
  - \`GET /api/activities-unified-preview/:type/:id\`
  - \`GET /api/enrollments-unified-preview\`
- [ ] **Strategia ID unificati temporanei**:
  - Trasmutazione ID legacy on-the-fly prepended in memory (es. \`ws_15\`, \`cr_42\`) per bypassare sovrapposizioni Primary Keys nei read dei calendari ibridi.
- [ ] **Regole season_id**:
  - Se orfano nel mapping legacy, fallback imperativo su \`storage.getActiveSeason()\`.
- [ ] **Regole legacy_source_type**:
  - Mapping stretto su Enum: \`courses\`, \`workshops\`, \`rentals\`, \`campus\`, \`sunday_activities\`, \`recitals\`.
- [ ] **Policy per pagamenti e enrollments**:
  - Modale pagamenti emetterà payload invariato. Dual-write asincrono su \`enrollments_unified\` e ghost-record legacy per salvaguardare Foreign Key su \`payments\`.
- [ ] **Dipendenze su calendario e planning**:
  - Cut-over del front-end (\`calendar.tsx\` / \`planning.tsx\`) non autorizzato in Fase 2. Transizione rimandata alla Fase 3.
`;
if (!checklist.includes('## Fase 12 - STI Fase 2')) {
  checklist += phase2Checklist;
}
fs.writeFileSync('_GAE_SVILUPPO/GAE_Checklist_Operativa.md', checklist);

// 2. Fix 12_GAE_Stato_Lavori_Per_Sezione.md
let stato = fs.readFileSync('_GAE_SVILUPPO/attuale/12_GAE_Stato_Lavori_Per_Sezione.md', 'utf8');
stato = stato.replace(
  "* **Cosa manca:** Smobilizzo effettivo dei tavoli DB legacy (Cancellazione tabelle), adozione estesa dello strato API STI in produzione per la contabilità.",
  "* **Cosa manca:** Fase 2 (Creazione Tabelle in Shadow Mode) non eseguita. NESSUNA UI runtime alterata; nessun DB reale va toccato ora. (Nota: La Fase 1 Design Esecutivo STI è Completata e Approvata)."
);
fs.writeFileSync('_GAE_SVILUPPO/attuale/12_GAE_Stato_Lavori_Per_Sezione.md', stato);
console.log('All files aligned successfully.');
