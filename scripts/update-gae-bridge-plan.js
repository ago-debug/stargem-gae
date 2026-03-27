const fs = require('fs');
const dateStr = new Date().toLocaleDateString('it-IT');

// 1. Update GAE_ULTIMI_AGGIORNAMENTI.md
let ultimi = fs.readFileSync('_GAE_SVILUPPO/GAE_ULTIMI_AGGIORNAMENTI.md', 'utf8');
const reportStr = `
### ${dateStr} - Phase 11: STI Bridge Plan Executive (001_AG_STI_BRIDGE_PLAN)
- **Azione**: Redazione del design esecutivo per il layer Bridge della Single Table Inheritance.
- **Dettagli**: 
  - Progettazione dettagliata schema \`activities_unified\` e \`enrollments_unified\` comprensiva di legacy tracking.
  - Mapping documentato per \`courses\`, \`workshops\`, \`rentals\`, \`campus\`, \`sunday_activities\` e \`recitals\`.
  - Architettura a 7 Fasi definita senza esecuzione distruttiva (Zero down-time target).
  - Previsione di Bridge API e Matrice Rischi (ID clashing, JSON matching, mapping).
  - Creato file \`18_GAE_STI_Bridge_Plan_Executive.md\`.
- **Stato**: Completato (Fase 1/7 - Puro Design Architetturale).
`;
ultimi = ultimi.replace('## STORICO AGGIORNAMENTI', '## STORICO AGGIORNAMENTI\n' + reportStr);
fs.writeFileSync('_GAE_SVILUPPO/GAE_ULTIMI_AGGIORNAMENTI.md', ultimi);

// 2. Append new sequence to task.md
let taskData = fs.readFileSync('/Users/gaetano1/.gemini/antigravity/brain/4ddc109b-6497-465d-a76f-f097e69364c0/task.md', 'utf8');
const newTaskSequence = `
# Phase 11: STI Bridge Pianificazione Esecutiva
## Planning
- [x] Schema Dettagliato Unified Activities ed Enrollments (con legacy flags).
- [x] Tabella Mapping DB Originale -> Nuovo Layer.
- [x] Specifiche Endpoint / API Bridge in memoria.
- [x] Redazione Matrice dei Rischi.
- [x] Definizione Roadmap (7 step).
- [x] Compilazione report di sistema e log documentale GAE.

---
`;
taskData = taskData.replace('---', newTaskSequence);
fs.writeFileSync('/Users/gaetano1/.gemini/antigravity/brain/4ddc109b-6497-465d-a76f-f097e69364c0/task.md', taskData);

console.log("Documents updated cleanly.");
