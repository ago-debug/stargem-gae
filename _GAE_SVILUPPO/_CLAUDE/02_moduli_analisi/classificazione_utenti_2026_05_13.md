---
aggiornato: 2026-05-13T18:00
ultima_verifica_vs_codice: 2026-05-13 (basato su dialogo Cowork + audit AG)
validita_prevista: 2026-06-13
tipo: proposal-modulo
priorita: P0-architetturale
tags: [classificazione, utenti, tesseramento, fatturazione, modello-dati, da-validare-team]
fonti:
  - "[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]"
  - "[[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]]"
  - "[[proposal_Quote_Param_2026_05_12]]"
  - "[[16_RECAP_COMPLETO_QUOTE_PARAM_E_QUOTE_CORSI]]"
  - "Dialogo Cowork – Gaetano 13/05/2026 16:00–18:00"
---

# Classificazione Utenti StarGem — Modello Concettuale (Draft 1)

> **Documento da rivedere col team.** Prodotto da Cowork dopo dialogo con Gaetano del 13/05/2026. Le sezioni “DA APPROFONDIRE CON TEAM” evidenziano i punti dove serve confronto interno o consulenza fiscale esterna.
> Collegato a [[CHECKLIST_PROGETTO]] Priorità #6 (SEG-002 rinominazione Anagrafica → Utente) + #3.5 (Quote_Param, listino parametrico).

---

## TL;DR

L’utente del gestionale StarGem si articola in **due tipi-radice** (Persona fisica, Società) e **tre ruoli di transazione** (Participant, Payer, BillingSubject) che possono essere combinati liberamente. Il **tesseramento** è un attributo solo della persona fisica, valido a stagione (settembre–agosto), e determina **prezzi agevolati** (listino a 2 livelli + override) e **tipo di documento fiscale** (tesserato → ricevuta istituzionale; non-tesserato → fattura). Esiste un’eccezione strutturale per i **paganti esterni** (Comune, sponsor, bandi) e per il **welfare aziendale** (formula variabile). Lo stato “attivo” ha due dimensioni separate: tessera valida e iscrizioni attive.

---

## 1. Modello concettuale emerso

### 1.1 Entità radice (chi è un utente)

- **Person** (persona fisica)
  - Può essere tesserata o no
  - Può essere minorenne (con uno o due tutori)
  - Può essere partecipante a una o più attività
  - Anagrafica completa anche se non-tesserata (vedi 1.4)

- **Society** (società / ente)
  - Normalmente cliente commerciale (mai tesserata)
  - **Eccezione**: con flag/relazione “convenzionata” per welfare aziendale formale (formule variabili)
  - Può essere Payer e/o BillingSubject

- **ExternalPayer** (pagante esterno non in CRM)
  - Per casi: Comune di Milano sponsor evento, borse di studio, bandi, donatori
  - Salvato come record “denormalizzato” (ragione sociale, CF/P.IVA, indirizzo) senza vivere come entità CRM piena
  - È sempre BillingSubject; raramente partecipa direttamente alle attività

### 1.2 Ruoli in una transazione (tre campi indipendenti)

| Ruolo | Cosa fa | Tipo entità ammessa |
|---|---|---|
| **Participant** | Fruisce dell’attività | Solo Person |
| **Payer** | Materialmente paga | Person, Society, ExternalPayer |
| **BillingSubject** | Riceve il documento fiscale | Person, Society, ExternalPayer (può differire da Payer) |

⚠️ **F1-004 Sess.2 (G Pagamenti) ha rilevato** che oggi `payments` ha solo `memberId` generico. Servono campi `payer_id`, `billing_subject_id`, plus discriminator `payer_type`/`billing_type` per gestire i 3 tipi di entità.

### 1.3 Relazioni di famiglia

- `MemberRelationship` (tabella già esistente in DB) gestisce il legame **genitore–figlio minorenne**
- Pattern uguale ad **Azienda paga corso a dipendenti**: il pagante (Person genitore o Society azienda) non è il partecipante
- ⚠️ F1-004 Sess.2 ha rilevato che `MemberRelationship` è **dead-code in scrittura**: la tabella esiste ma nessuna API la popola. Va collegata.

### 1.4 Anagrafica non-tesserati

- **Tutti i non-tesserati ricorrenti** (affitti, lezioni private regolari) hanno **anagrafica completa**
- Plus, possono avere flag `cliente_commerciale=true` se sono puramente business (mai tesserabili, es. azienda che affitta solo)
- Per **non-tesserati occasionali** (una tantum) si può anche salvare solo il minimo per fatturazione, ma di norma anagrafica piena

### 1.5 Lezioni di prova gratuite (trial)

- Anagrafica unica con flag `is_trial=true` finché non si tessera o si iscrive a un’attività a pagamento
- Genera una **booking confirmation** (mail/cell/carta) ma **nessun documento fiscale**
- ⚠️ **DA VERIFICARE NEL GESTIONALE LIVE**: come sono strutturati oggi i record di prova gratuita? Esiste già un flag o sono mescolati con i tesserati senza distinzione?

---

## 2. Tesseramento

### 2.1 Tessera unica annuale

- Una sola tipologia di tessera
- Durata stagione sportiva: **1 settembre – 31 agosto**
- Decade automaticamente, va rinnovata
- SKU “intoccabili” già a sistema: `2526QUOTATESSERA`, `2526DTYURI`, `2526DTNELLA` (vedi [[00_LEGGIMI]])

### 2.2 Stato “attivo” (due dimensioni separate)

| Dimensione | Valori | Significato |
|---|---|---|
| Tesseramento | Tesserato valido / Tesserato scaduto / Non-tesserato | Lo stato della tessera nella stagione corrente |
| Partecipazione | Partecipante / Non partecipante | Se ha almeno un’iscrizione attiva in corso |

**Combinabili in 4 stati operativi:**
- Tesserato + Partecipante (cliente attivo a tutti gli effetti)
- Tesserato + Non partecipante (ha la tessera ma non sta facendo nulla)
- Non-tesserato + Partecipante (es. lezione privata o affitto)
- Non-tesserato + Non partecipante (lead/prospect dormiente)

### 2.3 Trial → Tesserato (conversione)

Due flussi supportati:
1. **Manuale**: operatore riapre il record `is_trial=true` e lo “promuove” aggiungendo tesseramento + dati mancanti
2. **Automatico**: al primo pagamento attività a tariffa istituzionale, sistema rimuove flag e “promuove” il record (richiede logica di dedup intelligente)

⚠️ **DA VERIFICARE NEL GESTIONALE LIVE**: oggi esiste già un workflow di conversione? Trovato in audit F1-004 Sess.1 algoritmo `getDuplicateFiscalCodes` con Levenshtein che potrebbe servire qui.

---

## 3. Tassonomia attività e regola tesseramento

### 3.1 Attività dichiarate da Gaetano nel dialogo

**Attività a fatturazione ‘ricevuta’ quando tesserato:**
- Corsi continuativi (danza/fitness)
- Lezioni di prova a pagamento
- Lezioni di prova gratuite (booking, no doc fiscale)
- Lezioni singole (drop-in)
- Lezioni individuali (Personal Trainer)
- Campus (estivo/intensivo)
- Workshop (WS)
- Allenamenti
- Domeniche in movimento
- Merchandising

**Attività a fatturazione ‘fattura’ quando non-tesserato:**
- Lezioni individuali (PT)
- Eventi esterni
- Workshop (WS)
- Merchandising
- Domeniche in movimento
- Affitti sala

⚠️ **DA VERIFICARE NEL GESTIONALE LIVE** (login richiesto su stargem.studio-gem.it): elenco completo delle macro-tipologie effettivamente gestite oggi nel sistema, sottocategorie, e relativi SKU. Procedura proposta: Gaetano fa screenshot del menu principale + sottomenu attività dopo login, oppure mi dà accesso temporaneo via OAuth/SSO.

### 3.2 Mappa tesseramento per macro-attività

| Macro-attività | Tesseramento | Documento fiscale |
|---|---|---|
| **Corsi continuativi** | OBBLIGATORIO | Sempre ricevuta istituzionale |
| **Campus** | OBBLIGATORIO | Sempre ricevuta istituzionale |
| **Lezioni di prova a pagamento** | Facoltativo (e.g. trial) | Tesserato: ricevuta / Non-tesserato: fattura |
| **Lezioni di prova gratuite** | Facoltativo | Booking confirmation (no doc fiscale) |
| **Lezioni singole / drop-in** | Tipicamente tesserato | Ricevuta istituzionale |
| **Lezioni individuali (PT)** | Facoltativo (sconto a tesserati) | Tesserato: ricevuta / Non-tesserato: fattura |
| **Workshop / Stage** | Facoltativo (sconto a tesserati) | Tesserato: ricevuta / Non-tesserato: fattura |
| **Allenamenti** | Tipicamente tesserato | Ricevuta istituzionale |
| **Domeniche in movimento** | Facoltativo | Tesserato: ricevuta / Non-tesserato: fattura |
| **Eventi esterni** | Non applicabile (sempre commerciale) | Fattura |
| **Affitti sala** | Facoltativo (sconto a tesserati) | Sempre fattura |
| **Merchandising** | Facoltativo | Tesserato: ricevuta / Non-tesserato: fattura |

⚠️ **DA APPROFONDIRE CON TEAM**: il “merchandising” con ricevuta istituzionale (tesserato) ha senso fiscalmente? Solitamente la vendita di prodotti è attività commerciale per definizione. Validare con commercialista.

---

## 4. Documento fiscale (regola generale)

### 4.1 Regola pulita

> Lo **stato del soggetto** (tesserato/non-tesserato) determina il tipo di documento, NON la natura dell’attività.

- Tesserato + qualunque attività di sistema → ricevuta istituzionale (no IVA)
- Non-tesserato + qualunque attività → fattura (commerciale, con IVA)
- Lezione di prova gratuita → booking confirmation (no doc fiscale)
- Affitto sala → sempre fattura (anche al tesserato), è attività commerciale per definizione

⚠️ **DA APPROFONDIRE CON COMMERCIALISTA**: questa regola è fiscalmente corretta? Es. un tesserato che fa una lezione individuale — ricevuta istituzionale o fattura? Risposta di Gaetano “tesserato → ricevuta”, ma vale la pena validare formalmente.

### 4.2 Caso speciale: azienda paga corso di dipendente tesserato

**Tre opzioni considerate (Gaetano: “credo la 2 ma probabilmente anche la 3”):**
1. Solo fattura all’azienda per il totale (no ricevuta al dipendente)
2. **Split: fattura azienda per corso + ricevuta dipendente per tessera** (favorita)
3. Solo ricevuta al dipendente (azienda è solo “finanziatore”)

⚠️ **DA APPROFONDIRE CON COMMERCIALISTA**: nel diritto sportivo italiano, qual è lo split corretto fra attività istituzionale (tessera) e attività commerciale (corso fatto fatturare ad azienda)? Modello DB deve supportare entrambe le opzioni con flag `document_split_strategy`.

---

## 5. Listino parametrato

### 5.1 Modello base

- **2 livelli** di prezzo per ogni attività/SKU:
  - Prezzo tesserato (agevolato)
  - Prezzo non-tesserato (pieno)
- **Override manuale**: operatore può forzare un prezzo custom su singola riga del carrello, con campo `motivo` obbligatorio per audit/trasparenza
- Welfare/promo/agevolazioni gestite come **voci di sconto sovrapposte** sulla riga del carrello, NON come livello di listino (cf. [[proposal_Quote_Param_2026_05_12]])

### 5.2 Welfare aziendale (formula variabile)

Gaetano: “più di una formula” → modello flessibile con campi:
- Tipo accordo (sconto / pacchetto pre-pagato / tessera collettiva / mix)
- Listino prezzi dedicato per i dipendenti dell’azienda
- Quantità prepagata (se “pacchetto”)
- Validità temporale

Tabella esistente: `company_agreements` (21 record secondo MASTER_STATUS; 11 secondo RECAP_01 — ⚠️ valore discordante, da riconciliare).

---

## 6. Implicazioni per lo schema dati (Drizzle ORM)

### 6.1 Modifiche proposte (tutte ipotetiche, da verificare lato F1-004 e validare in audit)

```sql
-- Tabella nuova: external_payers (paganti esterni non-CRM)
external_payers (
  id, business_name, fiscal_code, vat_number, address, notes,
  tenant_id, created_at
)

-- Modifiche a payments
ALTER TABLE payments ADD COLUMN payer_id INT;
ALTER TABLE payments ADD COLUMN payer_type VARCHAR(20); -- 'member' | 'society' | 'external'
ALTER TABLE payments ADD COLUMN billing_subject_id INT;
ALTER TABLE payments ADD COLUMN billing_subject_type VARCHAR(20);
ALTER TABLE payments ADD COLUMN document_type VARCHAR(20); -- 'ricevuta' | 'fattura' | 'booking_only'

-- Modifiche a members (anagrafica)
ALTER TABLE members ADD COLUMN is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE members ADD COLUMN is_commercial_client BOOLEAN DEFAULT FALSE;
-- (verificare se esiste già qualcosa di simile prima di aggiungere)

-- Verificare se necessità di "tessere collettive"
-- (es. nuova tabella society_memberships per casi welfare)
```

### 6.2 Regola tenant_id

Tutte le nuove tabelle/colonne devono rispettare la **Regola 13** del [[00_LEGGIMI]]: `tenant_id` default `'1'`.

---

## 7. Tutte le domande poste a Gaetano (con risposte ricevute)

> Questo è il riepilogo completo del dialogo del 13/05/2026 16:00-18:00 da consegnare al team per ulteriori dettagli.

### 7.1 Zona 1 — Persona vs Società vs ruoli pagamento (4 domande)

**Q1. La mia sintesi dei 4 punti è corretta?**
- Risposta Gaetano: “Tutto corretto, vai avanti”

**Q2. Una società (es. Azienda Alfa) può essere essa stessa tesserata?**
- Risposta Gaetano: “Solo in casi speciali (welfare/convenzioni)”
- ⚠️ Team: confermare quali sono i “casi speciali” concreti e che record vanno nel CRM

**Q3. Quando un’azienda iscrive 5 dipendenti a un corso, come funziona?**
- Risposta Gaetano: “Dipende dalle situazioni, può esistere la 1 e 2” (Azienda paga + dipendenti si tesserano singolarmente OPPURE dipendenti partecipano senza tesserarsi)
- ⚠️ Team: il modello deve supportare entrambi i casi; va deciso quando applicare l’uno o l’altro

**Q4. Genitore che paga corso di figlio minorenne — è tesserato anche lui?**
- Risposta Gaetano: “No, solo il figlio è tesserato (genitore = solo pagante)”

### 7.2 Zona 1bis — Welfare, documento fiscale, pagante, intestatario (4 domande)

**Q5. La società convenzionata (welfare aziendale) cosa comporta?**
- Risposta Gaetano: “Più di una formula (variabile)”
- ⚠️ Team: elencare le formule reali in essere oggi con le aziende clienti

**Q6. Azienda paga corso di dipendente tesserato — documento fiscale?**
- Risposta Gaetano: “Credo la 2 ma probabilmente anche la 3” (split fattura+ricevuta OPPURE solo ricevuta dipendente)
- ⚠️ **DA VALIDARE CON COMMERCIALISTA**: qual è lo split fiscalmente corretto?

**Q7. Il pagante deve essere sempre un soggetto registrato nel gestionale?**
- Risposta Gaetano: “Può essere anche soggetto esterno generico”
- È confermata l’entità `ExternalPayer`

**Q8. L’intestatario fiscale coincide sempre col pagante?**
- Risposta Gaetano: “Può essere diverso”
- È confermata la necessità di un campo `billing_subject_id` separato

### 7.3 Zona 2 — Tassonomia attività e tesseramento (4 domande)

**Q9. Quali macro-attività offrite davvero?**
- Risposta Gaetano: tutte e 4 (Corsi continuativi, Lezioni private/PT, Affitti sala, Eventi/Stage/WS/Camp)
- Plus dettaglio in risposta Q12: corsi, lezioni di prova a pagamento e non, lezioni singole, lezioni individuali, campus, workshop, allenamenti, domeniche in movimento, merchandising, eventi esterni, affitti

**Q10. Tesseramento per CORSI CONTINUATIVI?**
- Risposta Gaetano: “Sempre obbligatorio”

**Q11. Tesseramento per LEZIONI PRIVATE / PT?**
- Risposta Gaetano: “Facoltativo (sconto se tesserato)”

**Q12. Tesseramento per AFFITTI SALA?**
- Risposta Gaetano: “Facoltativo (sconto a tesserati)”

### 7.4 Zona 2bis — Eventi, tessera, listino, documenti (4 domande)

**Q13. Tesseramento per EVENTI/STAGE/WS/CAMP?**
- Risposta Gaetano: “Facoltativo escluso il CAMPUS che è obbligatorio”
- Richiesta esplicita: rifare elenco attività dettagliato dal gestionale live

**Q14. Tessera — unica o più tipi?**
- Risposta Gaetano: “Una sola tessera, stagione settembre–agosto”

**Q15. Listino parametrato — quanti livelli?**
- Risposta Gaetano: “Vale il punto 1 ma anche il punto 3” (2 livelli base + override manuale; alcune attività obbligano tesseramento quindi solo un livello)

**Q16. Tesserato che fa lezione privata — documento?**
- Risposta Gaetano: Regola completa documentata in sezione 4 sopra (tesserato → ricevuta sempre; non-tesserato → fattura sempre; eccezione prova gratuita)

### 7.5 Zona 3 — Operatività stato attivo, anagrafica, prove, conversione (4 domande)

**Q17. Stato “attivo/non-attivo” — cosa significa?**
- Risposta Gaetano: “Tesserato attivo = tessera valida, plus può essere partecipante o non partecipante”
- È il modello a 2 dimensioni descritto in sezione 2.2

**Q18. Non-tesserato regolare — anagrafica completa?**
- Risposta Gaetano: “Punto 1 + 2” (anagrafica completa + flag commerciale per i puramente business)

**Q19. Lezioni di prova GRATUITE — come si tracciano?**
- Risposta Gaetano: “Punto 1 + 2” (anagrafica completa o minima a discrezione)
- Gaetano ha chiesto chiarimento su “TrialBooking dedicato” (poi superato in Q21)

**Q20. Non-tesserato → tesseramento — workflow?**
- Risposta Gaetano: “Punto 1 e 2” (stesso record che si arricchisce OPPURE upgrade automatico sistema)

### 7.6 Zona finale — modello trial, listino (2 domande)

**Q21. Modello tecnico per trial?**
- Risposta Gaetano: “Punto 1 ma verifica bene come siamo già strutturati” (anagrafica unica con flag, ma audit del codice esistente prima)

**Q22. “Prezzi variabili a discrezione” per il listino — cosa significa?**
- Risposta Gaetano: “Listino di base 2 livelli + override manuale”

---

## 8. Da approfondire con il team (caselle aperte)

1. **Welfare aziendale**: elencare formule reali in essere oggi (sconto su tesseramento? pacchetto pre-pagato? tessera collettiva? quante aziende usano cosa?)
2. **Documento fiscale split** (azienda paga corso di dipendente tesserato): è fattura+ricevuta o solo ricevuta dipendente? È il commercialista la fonte di verità
3. **Merchandising con ricevuta istituzionale**: legittimo fiscalmente o va sempre fatturato?
4. **Lezioni individuali**: nella lista “tesserato” sono “ricevuta”; nella lista “non-tesserato” sono “fattura”. Confermare che è davvero questa la regola operativa (potrebbe esserci complicanza fiscale)
5. **Rinominazione “Anagrafica” → “Utente”** (SEG-002): impatto su menu, route, label, traduzioni, breadcrumb — da pianificare con F2 frontend dedicato
6. **Tessere multiple in famiglia**: scontistica fratelli/sorelle già in essere? Come va modellata? (Gaetano: pattern “doppio tesseramento famiglia” non scelto, ma esiste sconto familiare?)
7. **Sponsor / Bandi / Donatori**: con che frequenza vengono usati pagamenti da `ExternalPayer`? Va modellato come priorità o si può rinviare?

---

## 9. DA VERIFICARE NEL GESTIONALE LIVE (stargem.studio-gem.it)

Cose che richiedono il login operativo e non possono essere dedotte dal codice o dal dialogo:

1. **Elenco completo attività effettivamente configurate**: menu principale + sottomenu prodotti/SKU
2. **Esistenza di flag `is_trial`** o equivalente sull’anagrafica esistente
3. **Workflow di conversione** trial → tesserato implementato oggi (se c’è)
4. **Numero record `company_agreements`** reale vs MASTER_STATUS (21) vs RECAP_01 (11) — quale è corretto
5. **Workflow di salvataggio iscrizioni** per minorenni: la tabella `member_relationships` viene davvero popolata da qualche endpoint?
6. **UI di gestione listino**: esiste già una pagina amministrativa per gestire price_rules / quote / promo? Dove?
7. **Casi reali di welfare aziendale** attivi oggi (vedere `company_agreements` reale)

Procedura proposta: Gaetano (o membro team) fa login, screenshot di menu/sottomenu attività, e li allega in `_CLAUDE/05_allegati/_segnalazioni/` per validazione.

---

## 10. Decisioni da prendere prima di partire con Fase 3

| # | Decisione | Chi decide | Bloccante? |
|---|---|---|---|
| 1 | Schema `external_payers` + `payer_type`/`billing_subject_type` in payments | Gaetano + Cowork | Sì, blocca audit Pagamenti |
| 2 | Workflow welfare aziendale (formule prioritarie) | Gaetano + team commerciale | No, può essere fase 4 |
| 3 | Documento fiscale split (azienda+dipendente tesserato) | Commercialista | Validazione, non bloccante per modello |
| 4 | Rinominazione “Anagrafica” → “Utente” (SEG-002) | Gaetano | No, separata da Fase 3 |
| 5 | Conversione trial automatica vs manuale | Cowork + audit codice esistente | Audit prima, decisione dopo |
| 6 | `MemberRelationship` collegare endpoint scrittura | F1 + F2 | Sì, blocca area E Minorenni |

---

## 11. Prossimi step (proposti)

1. Gaetano consegna documento al team per revisione e contributi (1-2 giorni)
2. Cowork si interfaccia col commercialista (via Gaetano) per validare regola fiscale documenti
3. Cowork lancia **Subagent Ricerca** per verificare nel codice attuale ([[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]]) i punti “DA VERIFICARE” della sezione 9
4. Una volta validato, scrivere prompt F1-NNN per refactor schema dati Payment (priorità #3 audit Pagamenti)
5. Parallelamente, Cowork+Gaetano discutono SEG-002 (rinomina + classificazione) come task separato

---

*Documento prodotto da Cowork-Claude dopo dialogo con Gaetano del 13/05/2026 16:00-18:00. Da rivedere col team prima di emettere prompt operativi ad AG.*
