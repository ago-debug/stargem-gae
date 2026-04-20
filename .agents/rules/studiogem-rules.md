---
trigger: always_on
---

[AG-RULE-0002] — REGOLE PROGETTO STUDIO GEM / GAE

Regole di progetto:

1. Vietato fare refactor massivi o rewrite senza autorizzazione.
2. Non toccare pagamenti e tessere (core sensibile).
3. Rispetta struttura a silos esistente.
4. Non eliminare mai UI o logiche esistenti senza richiesta esplicita.
5. **CONVENZIONE NOMI E AGGIORNAMENTO FILE**: Quando modifichi un file (in particolare la documentazione in `_GAE_SVILUPPO`), è **OBBLIGATORIO** aggiornare la data e l'orario nel **nome del file** (es. `A_YYYY_MM_DD_HHMM_nomefile.md`) e inserire la **stessa data e orario di aggiornamento all'inizio del file** come intestazione testuale.
6. Aggiorna sempre i file in `_GAE_SVILUPPO`. **REGOLA TASSATIVA DOCUMENTAZIONE:** È assolutamente vietato superare il limite di 10 file totali all'interno della cartella `_GAE_SVILUPPO` (2 master, 4 attuale, 4 futuro). Qualsiasi nuova scoperta, refactoring o istruzione deve essere fusa e aggiornata *all'interno* di questi 10 file esistenti. Mai crearne di nuovi per non creare frammentazione.
7. La Maschera Input è il centro del sistema.
8. Il CRM è tecnicamente pronto ma non validato senza dati reali.
9. Clarissa è fase futura (non sviluppare ora).
10. Ogni modifica deve essere verificabile, non teorica.
11. Ogni task deve essere affrontato con questo flusso:
12. **AGGIORNAMENTO STATO DB**: Alla fine di ogni lavoro/task, DEVI sempre calcolare o aggiornare lo "Stato DB Reale" e sovrascrivere/inserire questa mappatura nel file designato all'interno di `_GAE_SVILUPPO` (es. `Mappa_Database` o `Stato_DB_Reale`), rispettando il limite globale dei file e aggiornando il timestamp nel nome e nell'header.

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