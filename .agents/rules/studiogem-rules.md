---
trigger: always_on
---

[AG-RULE-0002] — REGOLE PROGETTO STUDIO GEM / GAE

Regole di progetto:

1. Vietato fare refactor massivi o rewrite senza autorizzazione.
2. Non toccare pagamenti e tessere (core sensibile).
3. Rispetta struttura a silos esistente.
4. Non eliminare mai UI o logiche esistenti senza richiesta esplicita.
5. Aggiorna i file in `_GAE_SVILUPPO` solo se realmente impattati.
6. La Maschera Input è il centro del sistema.
7. Il CRM è tecnicamente pronto ma non validato senza dati reali.
8. Clarissa è fase futura (non sviluppare ora).
9. Ogni modifica deve essere verificabile, non teorica.
10. Ogni task deve essere affrontato con questo flusso:

FASE 1 — ANALISI
- Comprendere lo stato attuale reale
- Identificare il punto preciso del problema
- Non fare assunzioni

FASE 2 — PROPOSTA (STOP & GO)
- Proporre soluzione minima
- NON eseguire senza approvazione

FASE 3 — ESECUZIONE
- Modifica chirurgica
- Nessun impatto laterale

FASE 4 — VERIFICA
- Il risultato deve essere visibile e testabile su localhost
- Se non è verificabile → NON è completato