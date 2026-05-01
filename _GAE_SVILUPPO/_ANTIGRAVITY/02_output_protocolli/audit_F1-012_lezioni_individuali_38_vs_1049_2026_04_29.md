# F1-PROTOCOLLO-012 — Audit Lezioni Individuali: 38 visibili vs 1049 conteggiate
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA

---

## A) Conteggi su Database
Ho analizzato la tabella `enrollments` unita a `courses` per filtrare `activity_type = 'lezione_individuale'`.
Ecco i numeri reali estratti da DB:
- **Totale enrollments (`activity_type='lezione_individuale'`):** 1049
- **Totale enrollments (`season_id=1`):** 1049
- **Totale enrollments (`status='active'`):** 1049
- **Totale Member distinti:** 1042
- **Totale Course distinti:** 3

## B) Composizione dei 1049 Record (I 3 Corsi)
Il totale di 1049 NON appartiene tutto al corso "Lezione Individuale". È suddiviso matematicamente su **3 attività distinte** che condividono lo stesso `activity_type`:
1. **Dottore Yuri** (ID 554, SKU `2526DTYURI`) → **655 iscritti**
2. **Dottore Nella** (ID 551, SKU `2526DTNELLA`) → **356 iscritti**
3. **Lezione Individuale** (ID 560, SKU `2526LEZINDIVIDUALE`) → **38 iscritti**

*(Totale esatto: 655 + 356 + 38 = 1049)*

## C) Logica di calcolo nel Frontend (`iscritti_per_attivita.tsx`)
- **L'Header "1049 iscrizioni attive"**: Deriva dalla query `useQuery({ queryKey: ["/api/enrollments?activityType=lezione_individuale"] })`. Questa API pesca correttamente dal DB tutte le iscrizioni dei 3 corsi citati sopra e le somma in `dynamicEnrollmentsCount`.
- **Il Badge "38 iscritti"**: È il badge associato *unicamente* alla singola scheda `Card` renderizzata per l'ID 560. Il frontend esegue un `filter(e => e.courseId === activity.id)` e trova giustamente 38 record per quella specifica scheda.

## D) Verifica Ipotesi dell'Utente
- **Ipotesi "1049 = prenotazioni singole"?** FALSO. I 1049 record sono associati a 1042 `member_id` **unici**. Questo significa che quasi ogni tesserato ha esattamente 1 riga di iscrizione attiva a uno dei 3 corsi (probabilmente una registrazione semestrale/annuale ai servizi medici o alle lezioni, non uno storico di "singole sedute").
- **Ipotesi "38 = tesserati distinti"?** FALSO. 38 sono semplicemente le iscrizioni del corso "Lezione Individuale". Gli altri 1011 tesserati sono iscritti ai corsi dei Dottori.

## E) Valutazione Architettura
Il modello attuale usa **1 record per iscrizione/abbonamento**, coerente col fatto che i membri sono quasi 1:1 rispetto alle righe. **Non è un bug dei conteggi.**

## F) Raccomandazioni e Conclusioni
**È un bug o una feature?** È una feature dal punto di vista del codice, ma un "misunderstanding" semantico/organizzativo.
La discrepanza visiva che segnali deriva dal fatto che i due "Dottori" (Yuri e Nella) sono stati censiti nel database con `activity_type = 'lezione_individuale'`. Pertanto l'API li include nel totale tab di 1049.
*Nota bene:* Se nella tua UI vedi fisicamente solo 1 scheda (anziché 3), è probabile che tu avessi inserito una parola nel campo "Cerca..." senza accorgertene, oppure i due dottori venivano ignorati visivamente. L'API li trasmette correttamente tutti e tre al client.

**Effort per fix (opzionale):** 5 minuti.
Se si desidera che i "Dottori" non rientrino nel conteggio delle "Lezioni Individuali", è sufficiente modificare il loro `activity_type` nel DB (es. da `lezione_individuale` a `servizio` o `visita_medica`). Se approvi, posso eseguire l'UPDATE SQL chirurgico sui corsi 551 e 554.
