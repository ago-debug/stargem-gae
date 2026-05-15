# REPORT F1-PROTOCOLLO-013-LIGHT: Spostamento DTYURI e DTNELLA
**Data:** 29/04/2026
**File Coinvolti:** Nessun file TSX/React. Solo Database MySQL.

## ATTIVITÀ ESEGUITE
1. **Generazione Backup Sicurezza**
   - Estratta l'intera tabella `courses` (Dati e Struttura implicita tramite query INSERT).
   - Salvato in: `/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1013LIGHT_PRE_UPDATE_DT_20260429.sql`
2. **Esecuzione Transazione (Atomica)**
   - Avviata transazione SQL.
   - Eseguito: `UPDATE courses SET activity_type = 'visita_medica' WHERE id IN (551, 554);`
   - Chiusura transazione con `COMMIT`.

## VERIFICA POST-UPDATE
- **Modifica Record Corsi:**
  - ID 551 (`2526DTNELLA`): passato a `visita_medica`.
  - ID 554 (`2526DTYURI`): passato a `visita_medica`.
- **Ereditarietà sulle Iscrizioni (Enrollments):**
  - Lezioni Individuali (`activity_type='lezione_individuale'`): Il DB riporta ora esattamente **38 enrollments** collegati all'unico corso rimasto (ID 560 `2526LEZINDIVIDUALE`).
  - Visita Medica (`activity_type='visita_medica'`): Il DB riporta ora esattamente **1011 enrollments** (somma di 356 + 655).

## RISULTATO SULLA UI (Atteso)
Senza alcun intervento sul codice sorgente, l'header della tab "Lezioni Individuali" in `/iscritti_per_attivita` rifletterà direttamente il nuovo perimetro impostato sul database, allineando finalmente il counter "1049" a "38", eliminando la discrepanza visuale e logica senza impattare il modello architetturale `1 record = 1 iscrizione`.
I due "Dottori" sono stati stralciati da questo raggruppamento e confinati nel nuovo activity_type `visita_medica`.
