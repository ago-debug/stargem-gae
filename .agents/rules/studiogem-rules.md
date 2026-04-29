---
trigger: always_on
---

[AG-RULE-0002] — REGOLE PROGETTO STUDIO GEM / GAE

Regole di progetto:

1. Vietato fare refactor massivi o rewrite senza autorizzazione.
2. Non toccare pagamenti e tessere (core sensibile).
3. Rispetta struttura a silos esistente.
4. Non eliminare mai UI o logiche esistenti senza richiesta esplicita.
5. **CONVENZIONE NOMI E BACKUP**: I file di status continuo in `_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/` hanno un **nome fisso** (senza timestamp). Prima di sovrascriverli, DEVI obbligatoriamente copiare la versione precedente in `_GAE_SVILUPPO/99_archivio/` anteponendo il timestamp (`YYYY_MM_DD_HHMM_nomefile.md`).
6. **TERRITORI SEVERI**: Non hai limite al numero di file, ma non puoi MAI modificare nulla in `_GAE_SVILUPPO/_CLAUDE/`. Scrivi i report e gli audit strutturati in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/`, e gli snapshot in `03_codice_in_lettura/`.
7. La Maschera Input è il centro del sistema.
8. Il CRM è tecnicamente pronto ma non validato senza dati reali.
9. Clarissa è fase futura (non sviluppare ora).
10. Ogni modifica deve essere verificabile, non teorica.
11. Ogni task deve essere affrontato con questo flusso:
12. **AGGIORNAMENTO STATO DB**: Alla fine di ogni lavoro/task, DEVI sempre calcolare o aggiornare lo "Stato DB Reale" e sovrascrivere/inserire questa mappatura in `_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_Mappa_Dati_e_Frontend.md`, previo backup.
13. **LETTURA INIZIO SESSIONE**: Quando apri una sessione operativa con Gaetano, leggi sempre prima: `00_LEGGIMI.md`, `MASTER_STATUS.md` in `_CLAUDE/01_canonici/`, il RECAP della chat attiva in `_CLAUDE/03_recap_chat/`, e la cartella `_CLAUDE/04_per_antigravity/`.

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