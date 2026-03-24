const fs = require('fs');

const dateStr = new Date().toLocaleDateString('it-IT');

// Update GAE_ULTIMI_AGGIORNAMENTI.md
let ultimi = fs.readFileSync('_GAE_SVILUPPO/GAE_ULTIMI_AGGIORNAMENTI.md', 'utf8');
const reportStr = `
### ${dateStr} - Phase 10: Unified Enrollments (Step 2 - Blindatura Maschera Input)
- **Azione**: Rimozione definitiva del blocco prototipale di inserimento partecipazioni dalla Maschera Input.
- **Dettagli**: 
  - Il form unificato (Select Corso, Modalità, Data) è stato rimosso da \`maschera-input-generale.tsx\`.
  - La griglia delle iscrizioni attive è stata rifattorizzata in modalità "sola lettura".
  - Introdotti Badge visuali (\`Iscrizione Standard\`, \`Prova Gratuita\`, \`Prova a Pagamento\`, \`Lezione Singola\`) ed esploso il mapping della \`targetDate\`.
  - Il flusso di creazione partecipazioni è ora in via esclusiva delegato al Modale Pagamenti (Carrello).
- **Stato**: Completato e collaudato.
`;
ultimi = ultimi.replace('## STORICO AGGIORNAMENTI', '## STORICO AGGIORNAMENTI\n' + reportStr);
fs.writeFileSync('_GAE_SVILUPPO/GAE_ULTIMI_AGGIORNAMENTI.md', ultimi);

// Update GAE_Checklist_Operativa.md
let checklist = fs.readFileSync('_GAE_SVILUPPO/GAE_Checklist_Operativa.md', 'utf8');
if (checklist.includes('10. UNIFIED ENROLLMENTS')) {
  checklist = checklist.replace(
    '- [ ] Maschera Input: Convertire riepiloghi in sola lettura, rimuovere form prototipali.',
    '- [x] Maschera Input: Convertire riepiloghi in sola lettura, rimuovere form prototipali.'
  );
  fs.writeFileSync('_GAE_SVILUPPO/GAE_Checklist_Operativa.md', checklist);
} else {
  console.log("Section 10 not found in checklist, skipping.");
}
console.log("Documents updated.");
