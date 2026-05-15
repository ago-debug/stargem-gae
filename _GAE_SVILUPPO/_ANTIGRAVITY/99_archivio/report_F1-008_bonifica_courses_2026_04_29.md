# F1-PROTOCOLLO-008 — Bonifica record courses (NULL + stagioni passate)
**Data:** 29/04/2026
**Modalità:** ESECUZIONE (DISTILLAZIONE MANUALE)

---

## 1. Verifica PRE-UPDATE
L'ispezione dei database ha fatto emergere la reale natura delle anomalie sospettate.

**ANOMALIA 1 (Corsi orfani con season_id = NULL):**
- Trovati esattamente **7 record** con `activity_type='course'` e `season_id=NULL`.
- Di questi, 5 erano attivi e 2 inattivi.
- Hanno SKU come `2526SANTOROMAR18`, a riprova della loro natura di corsi storici della stagione 25-26.
- Collegavano complessivamente **72 iscrizioni** (enrollments).

**ANOMALIA 2 (Corsi attivi di stagioni passate):**
- L'ispezione non ha riscontrato alcun record.
- **Risultato: 0 record.** I presunti 24 corsi extra ipotizzati in precedenza erano in realtà la somma dei 19 duplicati per la Stagione Futura 26-27 e dei 5 attivi dell'Anomalia 1. Non ci sono corsi "zombie" di stagioni antiche.

## 2. Backup
Prima di eseguire modifiche distruttive o mutazioni di stato, è stato prodotto un backup mirato tramite script Node.js che ha salvato la sintassi `REPLACE INTO` dei 7 record dell'Anomalia 1.
- **Path del backup:** `/Users/gaetano1/SVILUPPO/StarGem_manager/CHAT08_F1008_PRE_BONIFICA_20260429.sql`

## 3. UPDATE Eseguiti
Seguendo l'OPZIONE A approvata, i 7 record orfani sono stati assegnati alla Stagione 25-26.
- **Query:** `UPDATE courses SET season_id = 1 WHERE id IN (632, 641, 823, 824, 825, 826, 827)`
- **Righe Affette (Affected Rows):** 7

## 4. Verifica POST-UPDATE e Conteggi Finali
I conteggi confermano che la bonifica è riuscita e che l'architettura dei dati (limitatamente alla sezione `courses`) è pulita e priva di record sganciati dalla gerarchia delle stagioni.

- **Totale records `activity_type='course'` nel DB:** 330
- **Corsi 25-26 attivi (`season_id=1`):** 294 *(289 pre-bonifica + 5 recuperati)*
- **Corsi 26-27 attivi (`season_id=2`):** 16 *(esattamente i 16 legittimi rimasti dopo F1-010)*
- **Corsi residui con `season_id=NULL`:** 0
- **Corsi attivi in stagioni passate/fuori range (NOT IN 1, 2):** 0

**Stato del modulo:**
Il sistema è bonificato e stabilizzato. I conteggi in `/attivita/corsi` saranno ora coerenti e non presenteranno corsi non filtrabili.
