---
aggiornato: 2026-05-12T11:30
ultima_verifica_vs_codice: 2026-05-12T11:30
validita_prevista: continuo (prompt non datato, rilanciabile)
tipo: prompt-megaaudit
prompt_id: F1-004 + F2-003
fonti_originali:
  - 2026_04_20_classificazione_stargem_v2.pdf (PDF in _CLAUDE/05_allegati/_segnalazioni/)
  - testo originale incollato da Gaetano in chat Cowork 2026-05-12
---

# 🎯 Megaaudit Flusso Iscrizioni/Rinnovi/Acquisti — F1-004 + F2-003

> Collegati: [[MASTER_STATUS]] · [[CHECKLIST_PROGETTO]] · `00_LEGGIMI.md` (regole 13-21)

## Contesto

Gaetano vuole un audit COMPLETO del flusso reale del gestionale, basato sulla classificazione StarGem definita nel PDF `2026_04_20_classificazione_stargem_v2.pdf`. Tocca 16 aree (A-P), trasversali a Anagrafica, Tessere, Certificati, Pagamenti, Documenti, Canali, Stati, Sicurezza.

**Tipo:** read-only puro. Zero modifiche al codice/DB.
**Stima costo:** ~10-15h per F1 + ~10-15h per F2 (NON eseguibile in singola sessione: AG può fare l'audit in più passaggi, salvando avanzamenti progressivi).
**Output finale (per ognuno):** documento strutturato con (1) mappa stato 1-5 per ogni area, (2) tabella flussi reali vs desiderati, (3) piano operativo in 3 fasi.

---

## 🅰️ PROMPT F1-004 — Audit BACKEND Flusso Iscrizioni

Incolla in **AG-F1**:

```
PER AG-F1 (BACKEND) — PROMPT F1-004 — MEGAAUDIT FLUSSO ISCRIZIONI/RINNOVI/ACQUISTI (Backend)

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso art. 13-21)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/CHECKLIST_PROGETTO.md (Priorità #1 voce F1-004)
4. _GAE_SVILUPPO/_CLAUDE/05_allegati/_segnalazioni/2026_04_20_classificazione_stargem_v2.pdf (PDF di riferimento)
5. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/A_2026_05_11_Architettura_Core_Server.md (tuo faro)
6. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND.md (tuo faro)

NOTA: la tua risposta inizia con "Risposta F1-004". Output file con F1-004 nel nome. Riporta il numero nelle aggiornamenti F_*.

OBIETTIVO: Audit COMPLETO del flusso iscrizioni/rinnovi/acquisti dal punto di vista BACKEND (schema DB, route, storage, validazioni server, FK, audit log). Tipo read-only. ZERO modifiche.

REGOLE OPERATIVE:
- Non modificare codice
- Non fare refactor
- Non creare nuove feature
- Non generare migrazioni
- Non correggere file
- DEVI SOLO analizzare, mappare e proporre
- Verifica cosa esiste REALMENTE oggi nel codice + DB + endpoint (NO supposizioni)
- Ragiona come se dovessi verificare se il sistema è davvero pronto a gestire TUTTI i casi reali

================================================================
PARTE 1 — MAPPA REALE DELLO STATO ATTUALE (lato backend)
================================================================

Per ogni area indica lo stato reale scegliendo uno di:
1. COMPLETO E FUNZIONANTE
2. PRESENTE SOLO A DATABASE / BACKEND (ma manca esposizione)
3. PARZIALE
4. NON PRESENTE
5. PRESENTE MA RISCHIOSO / DA RIFARE

Per ogni area indica OBBLIGATORIAMENTE:
- Stato attuale: 1/2/3/4/5
- Cosa funziona oggi (route, storage method, validazione)
- Cosa manca o non funziona
- Endpoint backend coinvolti (path + verbo + nome funzione storage)
- Tabelle database coinvolte (con FK e indici)
- Rischio operativo
- Priorità: Alta / Media / Bassa
- Note tecniche

Cita SEMPRE nomi reali di file (server/routes.ts:LINEA), route (/api/...), tabelle, FK, indici, schemi Drizzle.

LE 16 AREE DA COPRIRE:

A. IDENTITÀ, RICERCA E UNIVOCITÀ PERSONA
   - A1-A10 + casi (madre/figli stessa email, omonimi, CF errati, ecc.)
   - Verifica: ricerca telefono/email/nome+cognome/data nascita/CF, validazione CF, anti-duplicato, alert

B. RUOLI MULTIPLI DELLA STESSA PERSONA
   - B1-B6: utente, tesserato, partecipante, genitore, pagante, intestatario, staff, team, insegnante, collaboratore, affittuario, referente società
   - Modello dati: come sono salvati i ruoli? (members + users + relazioni + tag + tabelle dedicate)

C. NUOVO UTENTE, ESISTENTE E DUPLICATI
   - C1-C8: verifica dati, creazione nuova anagrafica, merge duplicati, audit log, storico

D. VERIFICA DATI TRAMITE LINK
   - D1-D12: token, scadenza, collegamento scheda, conferma, completamento dati, upload, firma, tracking
   - L'utente vede dati esistenti? Può correggere? L'operatore vede stato?

E. MINORENNI, TUTORI E FAMIGLIE
   - E1-E12: identifica minori, tutor collegato, pagante=tutore, firmatario=tutore, relazione tabella `member_relationships`
   - Verifica in particolare se `member_relationships` è REALMENTE usata, popolata, collegata ai flussi operativi

F. PRATICA OPERATIVA / WORKFLOW
   - F1-F10: tabella dedicata pratiche? O stati sparsi tra members/memberships/enrollments/payments/medical_certificates?
   - Timeline, operatore assegnato, canale ingresso, data apertura/completamento, vista desk "cosa manca"

G. PAGAMENTI
   - G1-G14: distinzione partecipante/pagante/intestatario, pagante diverso da utente, pagante società, online vs desk, parziale/acconto, pagamenti orfani, stati (richiesto, pagato, parziale, insoluto, rimborsato, annullato), distinzione "pagato" da "abilitato"

H. TESSERAMENTO
   - H1-H11: tessera attiva per corsi, generazione automatica, rinnovo, stagione, scadenza, "pagato ma non tesserato", "tesserato ma documenti mancanti"

I. CERTIFICATO MEDICO
   - I1-I11: stati (mancante/caricato/da verificare/valido/scaduto/rifiutato), blocco accesso corso, notifiche scadenza, storico

J. DOCUMENTI, PRIVACY, REGOLAMENTI E FIRME
   - J1-J17: upload documenti, firma digitale/tablet/link, cartaceo scansionato, versionamento, chi/quando/canale firma, distinzione compilatore/firmatario, minore/adulto firma, segnala rischi legali

K. AREA TESSERATI B2C
   - K1-K15: account, password, dati personali, completamento dati, vedere corsi/pagamenti, caricare certificato, firmare documenti, rinnovare tessera, pagare, vedere "cosa manca"

L. CANALI DI INGRESSO
   - L1-L10: desk vs online vs telefono vs WhatsApp vs email vs tablet/totem vs area tesserati
   - Stesso motore? Duplicazioni tra flussi? Dati in posti diversi a seconda del canale?

M. STATI, BLOCCHI E ABILITAZIONE
   - M1-M15: stato centrale pratica, stato pagamento/tessera/certificato/documenti/dati confermati/abilitato/bloccato/pagato-ma-non-abilitato
   - Blocchi automatici o solo warning? Visibili al desk e all'utente? Implementati dove?
   - Ordine di priorità desiderato: pagamento → tessera → certificato → documenti

N. NON TESSERATI, SOCIETÀ E SERVIZI NON SPORTIVI
   - N1-N10: non tesserato per servizi non sportivi/affitti, distinzione corso sportivo vs servizio esterno, gestione società con referente persona fisica

O. NOTIFICHE E COMUNICAZIONI
   - O1-O12: email/SMS/WhatsApp, reminder automatici per ogni stato, storico comunicazioni, tracking inviato/aperto/fallito

P. SICUREZZA, TRACCIAMENTO E PERMESSI
   - P1-P12: audit modifiche anagrafiche/documentali/pagamenti/link/firme, identificazione operatore, permessi distinti (operatore/admin/staff/team/utente), protezione accesso dati altri utenti

OUTPUT MAPPA (PARTE 1):
Tabella unica con colonne:
- Area
- Stato 1-5
- Cosa funziona oggi (backend)
- Cosa manca (backend)
- Endpoint backend (path + handler)
- Tabelle DB
- Rischio operativo
- Priorità Alta/Media/Bassa
- Note tecniche

Seconda tabella:
- Flusso reale oggi (backend)
- Flusso desiderato (backend)
- Gap
- Rischio
- Intervento consigliato

================================================================
PARTE 2 — PIANO OPERATIVO IN 3 FASI (lato backend)
================================================================

Solo DOPO la mappa, prepara il piano operativo backend in 3 fasi:

FASE 1 — STABILIZZAZIONE E MAPPA OPERATIVA MINIMA
Obiettivo: rendere chiaro e sicuro il flusso attuale senza stravolgere il gestionale.
Interventi minimi su: ricerca anagrafica, controllo duplicati, CF, distinzione partecipante/pagante/tutore, stati (pagamento/tessera/certificato/documenti), vista desk "cosa manca", tracciamento azioni operatore.
Conservativa.

FASE 2 — LINK UTENTE, AREA TESSERATI E COMPLETAMENTO DATI
Obiettivo: permettere all'utente di completare/confermare dati senza appesantire la segreteria.
Interventi: link verifica con token+scadenza, area personale, completamento dati, upload documenti/certificato, firma digitale/tablet/link, stato visibile operatore, reminder automatici, distinzione compilatore/firmatario.

FASE 3 — OMNICANALITÀ COMPLETA E AUTOMAZIONI
Obiettivo: unificare desk/online/telefono/WhatsApp/tablet/totem/area personale nello stesso motore operativo.
Interventi: flusso unico iscrizione/rinnovo/acquisto, pagamento online completo, pagamento desk completo/parziale, link pagamento, pratica telefonica/WhatsApp assistita, blocchi automatici/warning, notifiche automatiche, dashboard pratiche incomplete, automazioni CRM future, eventuale wallet/tessera digitale, reportistica direzionale.

Per ogni fase indica:
- Obiettivo
- Motivazione
- Cosa modificare (backend)
- Cosa NON modificare
- File coinvolti
- Endpoint coinvolti
- Tabelle coinvolte
- Rischio
- Test da fare
- Risultato atteso
- Criterio di completamento

OUTPUT PIANO (PARTE 2):
Tabella con colonne:
- Fase
- Obiettivo
- Intervento
- Priorità
- Moduli coinvolti
- File frontend (cita se serve, ma focus backend)
- Endpoint backend
- Tabelle DB
- Rischio tecnico
- Rischio operativo
- Test necessari
- Criterio di completamento

Lista finale:
1. Interventi da fare subito
2. Interventi da fare dopo
3. Interventi da non fare ancora
4. Punti da decidere con la direzione
5. Punti da validare con la segreteria
6. Punti da validare con F2 (frontend)

================================================================
DELIVERABLE F1
================================================================
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md

Frontmatter (regola 17):
---
aggiornato: 2026-05-12THH:MM
ultima_verifica_vs_codice: 2026-05-12THH:MM
validita_prevista: 14 giorni
prompt_di_riferimento: F1-004
fonti_verificate: [codebase server/, shared/, DB stargem_v2, classificazione_stargem_v2.pdf]
---

TRACCIABILITÀ (Regola 15):
- Aggiorna F_<HHMM>_ULTIMI_AGGIORNAMENTI.md in cima ad ogni fase chiusa
- Aggiorna CHECKLIST_PROGETTO quando F1-004 è completato

PROCEDIMENTO SUGGERITO (per non perdersi):
Data la mole, procedi in 3-4 sessioni:
1. Sessione 1: Aree A, B, C, D (identità + ruoli + duplicati + verifica link)
2. Sessione 2: Aree E, F, G, H (minori + pratica + pagamenti + tessera)
3. Sessione 3: Aree I, J, K, L (certificato + documenti + B2C + canali)
4. Sessione 4: Aree M, N, O, P (stati/blocchi + non tesserati + notifiche + sicurezza) + tabelle finali + PARTE 2 piano

Alla fine di ogni sessione: aggiorna il documento di output e l'F_* con quello che hai coperto + cosa rimane. Stop & Go a fine di ogni sessione.

STOP & GO: zero modifiche al codice. Solo lettura + scrittura del documento di audit.
```

---

## 🅱️ PROMPT F2-003 — Audit FRONTEND Flusso Iscrizioni

Incolla in **AG-F2**:

```
PER AG-F2 (FRONTEND) — PROMPT F2-003 — MEGAAUDIT FLUSSO ISCRIZIONI/RINNOVI/ACQUISTI (Frontend)

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso art. 13-21)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/CHECKLIST_PROGETTO.md (Priorità #1 voce F2-003)
4. _GAE_SVILUPPO/_CLAUDE/05_allegati/_segnalazioni/2026_04_20_classificazione_stargem_v2.pdf (PDF di riferimento)
5. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/B_2026_05_11_Frontend_Moduli.md (tuo faro)
6. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_2026_05_11_Mappa_Dati_e_Frontend_FRONTEND.md (tuo faro)
7. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/H_2026_05_11_Design_System.md (tuo faro)

NOTA: la tua risposta inizia con "Risposta F2-003". Output file con F2-003 nel nome. Riporta il numero negli aggiornamenti F_*.

OBIETTIVO: Audit COMPLETO del flusso iscrizioni/rinnovi/acquisti dal punto di vista FRONTEND (pages, components, modali, hooks, flussi UX, validazioni client, copertura sui canali). Tipo read-only. ZERO modifiche.

REGOLE OPERATIVE: identiche a F1-004 (no modifiche, no refactor, no nuove feature, solo audit).

[Stesso elenco di 16 aree A-P come F1-004, ma analizzate dal punto di vista FRONTEND/UX]

PER OGNI AREA indica:
- Stato attuale: 1/2/3/4/5
- Cosa l'UI mostra/permette oggi
- Cosa manca a livello di UI/UX (es. "il sistema permette tutto ma l'operatore non ha modo di vedere lo stato")
- File frontend coinvolti (pages, components, hooks, contexts)
- Modali/wizard/flussi UX coinvolti
- Rischio operativo per il desk e l'utente
- Priorità: Alta / Media / Bassa
- Note tecniche
- Note operative per segreteria/desk (come si lavora oggi in pratica?)

Cita SEMPRE nomi reali: client/src/pages/<file>.tsx, components/<file>.tsx, hook usePMM, ecc.

OUTPUT MAPPA (PARTE 1):
Tabella unica con colonne:
- Area
- Stato 1-5
- Cosa funziona in UI oggi
- Cosa manca in UI
- File frontend
- Modali/flussi coinvolti
- Rischio operativo
- Priorità Alta/Media/Bassa
- Note operative segreteria/desk

Seconda tabella:
- Flusso reale oggi (UX/desk)
- Flusso desiderato (UX/desk)
- Gap
- Rischio
- Intervento consigliato

PARTE 2 — PIANO OPERATIVO IN 3 FASI (lato frontend)
Stesse 3 fasi del F1, ma con focus frontend.
Per ogni fase: obiettivo, file coinvolti (frontend), modali/component nuovi, rischio UX, test funzionali, criterio di completamento.

================================================================
DELIVERABLE F2
================================================================
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F2-003_flusso_iscrizioni_frontend_2026_05_12.md

Frontmatter (regola 17):
---
aggiornato: 2026-05-12THH:MM
ultima_verifica_vs_codice: 2026-05-12THH:MM
validita_prevista: 14 giorni
prompt_di_riferimento: F2-003
fonti_verificate: [codebase client/, classificazione_stargem_v2.pdf]
---

TRACCIABILITÀ (Regola 15):
- Aggiorna F_<HHMM>_ULTIMI_AGGIORNAMENTI.md in cima ad ogni fase chiusa
- Aggiorna CHECKLIST_PROGETTO quando F2-003 è completato

PROCEDIMENTO SUGGERITO (per non perdersi):
Stessa suddivisione in 4 sessioni come F1-004 (Aree A-D, E-H, I-L, M-P + tabelle + piano).

STOP & GO: zero modifiche al codice. Solo lettura + scrittura del documento di audit.
```

---

## Cosa farà Claude (Cowork) dopo

Quando F1-004 e F2-003 sono entrambi completi:
1. Leggo i due audit
2. Identifico le DIVERGENZE tra cosa funziona "backend" e cosa è esposto "frontend" (es. *"il backend supporta X ma la UI non lo offre"*)
3. Costruisco un **piano refactor unico** in `_CLAUDE/02_moduli_analisi/piano_refactor_flusso_iscrizioni_2026_05_12.md` con la sequenza esatta di interventi parallelizzabili F1+F2
4. Da quel piano emergeranno i prossimi prompt operativi (F1-005, F2-004, ecc.) per le 3 fasi di esecuzione

---

*Prompt creato da Claude (Cowork) — 2026-05-12T11:30 — basato sul testo originale incollato da Gaetano.*
