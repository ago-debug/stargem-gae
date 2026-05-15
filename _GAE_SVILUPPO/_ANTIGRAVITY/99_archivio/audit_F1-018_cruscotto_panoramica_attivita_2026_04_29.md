# AUDIT F1-PROTOCOLLO-018: Cruscotto Panoramica Attività
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA + QUERY DB

## SINTESI QUERY DI VERIFICA (Dati Reali da DB)
- **Q1 (Sale):** 13 totali / 13 attivi (`studios`).
- **Q2 (Insegnanti attivi):** 70 (da `members` dove `participant_type` contiene 'insegnante' o 'staff').
- **Q3 (Categorie):** 8 (da `custom_list_items` dove `list_id` corrisponde a `categoria_corsi`).
- **Q4 (Tesserati attivi 25/26):** 2301 (su `memberships` join `seasons`).
- **Q5 (Iscrizioni attive):** 12234 (su `enrollments`).
- **Q6 (Certificati scaduti):** 244 (su `medical_certificates`).
- **Q7 (Tessere mancanti):** 2617 (su `members` attivi senza una membership attiva per la stagione in corso).

---

## A) ENDPOINT ESISTENTI & TAB
Al momento non ci sono endpoint aggregatori che servono queste metriche precise out-of-the-box. Raccoglierle chiamando `/api/members`, `/api/courses`, ecc. lato client sarebbe folle per via della mole di dati (migliaia di iscritti/iscrizioni). La soluzione ottima è creare nuove query aggregate sul server.

### B) TAB 1 — OGGI (Effort: ~1 ora)
- **Lezioni in corso ora:** Si calcola con un semplice `WHERE day_of_week = ? AND start_time <= ? AND end_time >= ?` in tabella `courses` (Costo: basso).
- **Lezioni dopo le 18:** Idem, ma con `start_time >= '18:00'`. (Costo: basso).
- **Sale occupate ora:** `COUNT(DISTINCT studio_id)` dalle lezioni in corso. (Costo: basso).
- **Insegnanti in turno:** La tabella `team_scheduled_shifts` esiste e contiene già 84 record configurati. Basterà filtrare per la data di oggi e status. (Costo: basso).

### C) TAB 2 — RISORSE (Effort: ~30 min)
- **Insegnanti attivi:** Già calcolato in Q2 (70). Costo bassissimo.
- **Personal trainer attivi:** Identico a Q2 ma stringa LIKE diversa (Costo: bassissimo).
- **Sale attive:** Già calcolato in Q1 (13).
- **Categorie:** Già calcolato in Q3 (8).

### D) TAB 3 — SALUTE DATI (Effort: ~1.5 ore) ⚠️ TAB PIÙ RISCHIOSO
- **Tessere mancanti:** Query in Q7 restituisce 2617. *Attenzione!* Molti di questi potrebbero essere ex clienti storici mai messi a `active=0`. Sarà necessario raffinare la query, ad es. contare "Tessere mancanti" SOLO tra coloro che hanno `enrollments` attivi in questa stagione.
- **CF mancanti:** Semplice (count di cf vuoti o null per utenti attivi).
- **Certificati scaduti:** Già calcolato in Q6 (244).
- **Pagamenti orfani:** Criterio da stabilire (es. "enrollment attivo ma somma dei pagamenti = 0"). Richiederà un join tra `enrollments`, `price_items` (se presenti) e `payments`. Costo: Medio/Alto.

### E) TAB 4 — STAGIONE (Effort: ~30 min)
- **Iscrizioni totali:** Già calcolato in Q5 (12234). Costo bassissimo.
- **Tesserati attivi:** Già calcolato in Q4 (2301). Costo bassissimo.
- **Media iscrizioni per corso:** Divisione tra Q5 e Corsi attivi. Costo bassissimo.

---

## F) STRATEGIA ENDPOINT RACCOMANDATA
**Singolo Endpoint Unificato** (`/api/dashboard/attivita-panoramica`).
- *Perché:* Il widget Panoramica è la primissima cosa che l'utente vede all'ingresso nella pagina. Fare 4 chiamate HTTP separate per i tab causerebbe sfarfallii (waterfall).
- Dato che questi KPI sono tutti semplici funzioni `COUNT()`, eseguirle insieme in backend in Parallelo (tramite un array di Promise in Node) impiegherà non più di 20-50 millisecondi totali.
- Restituirà un oggetto JSON strutturato: `{ oggi: {...}, risorse: {...}, salute: {...}, stagione: {...} }`.

## G) EFFORT TOTALE STIMATO E RISCHI
- **Totale backend + frontend UI:** ~3.5 / 4 ore.
- Il **rischio maggiore** si concentra sulle definizioni di business nel Tab "Salute Dati" (Pagamenti Orfani e Tessere Mancanti), per evitare di mostrare al cliente numeri "spaventosi" (es. 2617 tessere mancanti) solo perché il DB contiene storici decennali non ripuliti.

*(Audit di sola lettura concluso con successo)*
