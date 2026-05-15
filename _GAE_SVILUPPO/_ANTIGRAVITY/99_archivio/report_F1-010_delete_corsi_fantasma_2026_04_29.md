# F1-PROTOCOLLO-010 — Delete Corsi Fantasma
**Data:** 29/04/2026
**Modalità:** ESECUZIONE (DISTILLAZIONE MANUALE)

---

## 1. Verifica PRE-DELETE
Sono stati localizzati ed esaminati i 3 record fantasma (ID 846, 847, 848) creati per errore con il bottone duplicazione rapida in `courses.tsx`.
Tutti i controlli d'integrità referenziale hanno dato esito negativo. I corsi erano completamente isolati ("vergini"):
- `enrollments` collegate: **0**
- `attendances` collegate: **0**
- `staff_presenze` collegate: **0**
- `staff_sostituzioni` collegate: **0**
- `payments` (indirette tramite enrollments): **0**

## 2. Backup
Non essendo disponibile il comando di sistema `mysqldump` nell'ambiente corrente, il backup è stato generato tramite uno script Node.js custom che ha interrogato il database (via connessione Drizzle preesistente) ed estratto le istruzioni SQL standard (`INSERT INTO`) per i 3 record.
Il file di backup è stato scritto ed è reperibile in:
`/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1010_PRE_DELETE_20260429.sql`

## 3. Risultato DELETE
Il comando di eliminazione è stato eseguito chirurgicamente e in modo massivo.
- **Query:** `DELETE FROM courses WHERE id IN (846, 847, 848)`
- **Righe Affette (Affected Rows):** 3
- **Verifica immediata:** Una `SELECT id` sugli stessi ID ha restituito **0** righe. I record sono stati eliminati correttamente.

## 4. Verifica POST-DELETE e Stato Finale
Una volta ripulito lo storico fallato, lo stato effettivo della stagione 26-27 (`season_id = 2`) risulta coerente e stabile.
- **Totale Corsi per season_id = 2:** 16
- **Totale Corsi ATTIVI per season_id = 2:** 16

Il database è ora pulito dalle sbavature di duplicazione e pronto per ricevere le future duplicazioni tramite il Modale corretto.
