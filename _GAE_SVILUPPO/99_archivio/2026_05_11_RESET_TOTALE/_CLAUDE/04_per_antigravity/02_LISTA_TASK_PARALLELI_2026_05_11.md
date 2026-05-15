---
tags: [antigravity, task-list, lavoro-parallelo, ripresa]
aggiornato: 2026-05-11
tipo: lista-task
---

# 📋 Lista Task Paralleli per Antigravity — 2026_05_11

> Collegati: [[00_INDEX]] · [[MASTER_STATUS]] · [[00_BRIEFING_RIPRESA_2026_05_05]] · [[01_PROMPT_APERTURA_AG]]

## ⚠️ AGGIORNATO 2026-05-11 — Riallineato post-strategic review

**Cambiamenti** (vedi [[strategic_review_sintesi_2026_05_11]]):
- **TASK 1 — SUPERATO**: F1 ha risposto alle 4 domande di Gaetano direttamente nella strategic review (vedi `_ANTIGRAVITY/02_output_protocolli/strategic_review_F1_backend_2026_05_11.md` § domanda 4)
- **TASK 2 — CANCELLATO**: F2 ha bocciato il tab "Incolla Testo" come inutile complicazione UX
- **TASK 3, 4, 5 — restano validi**
- **TASK 6 — riformulato e diventa P2 del piano 6-8 settimane** (vedi MASTER_STATUS sezione "Piano priorità 6-8 settimane")

## Contesto

Gaetano sta organizzando i dati (members/memberships/payments) per una **re-importazione completa** tramite `/importa`. Questa fase richiede pulizia degli Excel e attesa lato suo. Nel frattempo AG può lavorare su task **indipendenti dal re-import** per non sprecare tempo.

Tutti i task qui sotto rispettano le regole del [[00_LEGGIMI]]:
- AG scrive solo in `_ANTIGRAVITY/` e nel codice
- Backup DB obbligatorio prima di qualunque modifica DB
- Deploy solo da Gaetano via Plesk
- Stop & Go prima di ogni modifica (incluso `npx tsc --noEmit` + lint + test secondo articolo 14 di 00_LEGGIMI)

---

## 🚦 Ordine consigliato di esecuzione (aggiornato 2026-05-11)

| Step | Task | Tipo | Stima | Stato |
|---|---|---|---|---|
| ~~1~~ | ~~Analisi architetturale tabella `members`~~ | F1 | — | ✅ COMPLETATO da AG nella strategic review 11/05 |
| ~~2~~ | ~~Tab "Incolla Testo" in `/importa`~~ | F2 | — | ❌ CANCELLATO (F2 bocciato) |
| 3 | Investigare bug raggruppamento corsi Planning (12_Gemdario) | F1+F2 read-only | 30-45 min | 🟢 PRIORITARIO — sblocca UI FREEZE |
| ~~4~~ | ~~Verifica fix calendario auto-advance~~ | F2 verifica | — | ✅ COMPLETATO 2026-05-11 (fix già presente, archiviato F_*) |
| ~~5~~ | ~~Reimport turni GemTeam~~ | F1 import | — | ❌ CANCELLATO 2026-05-11 (Gaetano ha rimesso turni manualmente, sezione operativa) |
| 6 | Fix UI 10_Utenti — esporre 54+ campi Athena | F1+F2 | 1-2h | 🟡 ASPETTA — richiede prima il refactor JOIN su `memberships`/`medical_certificates` (vedi piano 6-8 settimane) |

**Decisione bloccante (non un task, ma sblocca lavoro futuro):** Gaetano deve scegliere STRADA A / B / A+B per la mappatura `/importa` (vedi `_ANTIGRAVITY/02_output_protocolli/StopAndGo_CampiDinamici.md`).

---

## TASK 1 — Analisi architetturale tabella `members` (le 4 domande)

**Tipo:** F1 read-only (analisi schema + grep codice)
**Output:** documento in `_ANTIGRAVITY/02_output_protocolli/analisi_members_architettura_F1-001_2026_05_11.md`
**Perché ora:** Gaetano vuole rispondere a queste 4 domande prima di permettere ulteriori modifiche a `members`. Sono in coda dal 04/05 in `E_Segnalazioni_DB.md`.

### Prompt copia-incolla per AG-F1

```
PER AG-F1 (BACKEND)

PRIMA AZIONE OBBLIGATORIA: leggi nell'ordine
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione DOMANDE APERTE DI GAETANO)
3. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/E_Segnalazioni_DB.md
4. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_24_DBMonitor.md

OBIETTIVO: rispondere in modo strutturato alle 4 domande architetturali di Gaetano sulla tabella `members`, senza eseguire nessuna modifica.

DOMANDE A CUI RISPONDERE
1. Perché i dati tessere (intervallo colonne O-U di `members`) sono dentro `members` e non in `memberships`? Sono retaggio storico di import? Sono in uso da qualche route? Si possono droppare o vanno mantenuti per retrocompatibilità?
2. Stesso quesito per i certificati medici (intervallo colonne V-W di `members`): perché lì e non in `medical_certificates`?
3. Colonna A (id) — è ancora utile? Quali route e quali tabelle hanno foreign key verso `members.id`?
4. Colonna BA — a cosa serve? Posso droppare quei "vecchi id" come suggerisce Gaetano?

METODO DI ANALISI (sola lettura)
- SHOW COLUMNS FROM members; identifica precisamente quali colonne stanno negli intervalli O-U e V-W (richiede capire l'ordine fisico delle colonne MariaDB).
- grep delle colonne sospette in:
  - shared/schema.ts
  - server/routes.ts e server/routes/**
  - server/storage.ts
  - client/src/pages/**/*.tsx (per capire se sono mostrate in UI)
- Identifica le FK in entrata su `members.id`: SELECT da information_schema o grep dello schema.
- NON proporre migrazioni concrete. Solo analisi + raccomandazione.

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/analisi_members_architettura_F1-001_2026_05_11.md

Struttura output:
## Domanda 1 — Dati tessere in members
- Colonne identificate negli intervalli O-U (lista esatta nomi)
- Sono usate da route/codice? (lista riferimenti)
- Sono duplicate con memberships? (analisi sovrapposizione)
- Raccomandazione: mantenere / droppare / migrare a memberships
- Rischi della scelta

## Domanda 2 — Certificati medici in members (V-W)
[stessa struttura]

## Domanda 3 — Colonna A (id)
[stessa struttura]

## Domanda 4 — Colonna BA
[stessa struttura]

## SINTESI PER GAETANO
3-5 righe di executive summary con raccomandazione finale.

STOP & GO: zero modifiche al DB o al codice. Solo lettura e scrittura del documento di analisi. Aspetta Gaetano per ogni step successivo.
```

---

## TASK 2 — Tab "Incolla Testo" in `/importa`

**Tipo:** F2 frontend puro
**Output:** modifica `client/src/pages/import-data.tsx` (file Gaetano usa per import)
**Perché ora:** già pre-approvato nel `StopAndGo_FixImportUI_PM2.md` del 05/05, AG aspetta solo conferma. Utile per il re-import che Gaetano sta preparando.

### Prompt copia-incolla per AG-F2

```
PER AG-F2 (FRONTEND)

PRIMA AZIONE OBBLIGATORIA: leggi nell'ordine
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/StopAndGo_FixImportUI_PM2.md
4. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_22_ImportExportBonifica.md

OBIETTIVO: implementare il terzo tab "Incolla Testo" in /importa come da proposta del 05/05 (StopAndGo_FixImportUI_PM2).

SPECIFICA
- Aggiungere un terzo tab nella TabsList di import-data.tsx ("Carica file" + "ID Google Sheets" + nuovo "Incolla Testo")
- Tab "Incolla Testo" deve contenere:
  - Una <Textarea> multi-linea per testo libero massivo
  - Un bottone "Analizza" che converte il testo in un Blob/File (text/csv o text/tab-separated-values, basato sull'autodetect del primo carattere separatore tra TAB e ;)
  - Il Blob/File creato viene passato alla mutation filePreviewMutation esistente
- UI: TabsList passa da grid-cols-2 a grid-cols-3
- Mantieni la stessa esperienza: dry-run, banner CF/stagione/Smart Routing, report CSV finale

REGRESSIONI DA EVITARE
- Non rompere il flusso esistente (file upload + Google Sheets)
- Non modificare le API backend
- Non modificare le regole di Smart Routing

OUTPUT
1. File modificato: client/src/pages/import-data.tsx
2. Report in _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F2-002_tab_incolla_testo_2026_05_11.md

STOP & GO: dopo l'analisi del file attuale e prima di scrivere il codice del nuovo tab, mostrami una bozza del JSX previsto. Aspetto OK prima dell'implementazione.
```

---

## TASK 3 — Investigare bug "raggruppamento corsi Planning sparito"

**Tipo:** F1 + F2 read-only (analisi)
**Output:** documento di investigazione, niente fix per ora
**Perché ora:** UI FREEZE in vigore su 12_Gemdario — solo investigare. Identifica la causa così quando si toglierà il freeze, il fix è già pronto da implementare.

### Prompt copia-incolla per AG-F1+F2

```
PER AG-F1 (BACKEND) e AG-F2 (FRONTEND) — analisi parallela

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (sezione UI FREEZE su 12_Gemdario)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione 12_Gemdario)
3. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_12B_Gemdario.md

OBIETTIVO: investigare il bug "raggruppamento corsi nel Planning sparito" (bug MASTER segnalato da Gaetano) e identificarne la causa, SENZA fixare. UI FREEZE in vigore.

METODO (read-only)
- F1: analizza l'endpoint che alimenta il Planning. Cerca se il raggruppamento avveniva backend (es. GROUP BY) o se era solo frontend.
- F2: analizza planning.tsx o equivalente. Cerca riferimenti recenti (git log) a "group", "raggruppamento", "grouped", "groupBy".
- Confronta con il calendario operativo (calendar.tsx) che il raggruppamento ce l'ha — vedi cosa fa di diverso.

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/analisi_bug_planning_groupby_F1F2-003_2026_05_11.md

Struttura:
## Stato attuale del Planning
## Differenze col Calendario operativo
## Probabile causa del bug
## Proposta di fix (descrizione concettuale, NON codice)
## Rischio di regressione
## Stima implementazione (quando si potrà togliere UI FREEZE)

STOP & GO: zero modifiche al codice. Solo analisi e documento. Aspetta Gaetano per il via libera al fix futuro.
```

---

## TASK 4 — Verifica fix calendario auto-advance

**Tipo:** F2 verifica
**Output:** chiusura del task o nuovo prompt fix
**Perché ora:** lo `StopAndGo_FixCalendarioAttivita.md` del 04/05 è stato approvato? Mai eseguito? Verifica veloce.

### Prompt copia-incolla per AG-F2

```
PER AG-F2 (FRONTEND)

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/StopAndGo_FixCalendarioAttivita.md

OBIETTIVO: verifica se il fix proposto nel StopAndGo è stato implementato in calendar.tsx.

METODO
- Apri client/src/pages/calendar.tsx
- Cerca la logica di "auto-advance" stagione (controllo mese Feb-Lug → forza stagione successiva)
- Verifica se è ancora attiva o se è stata commentata/rimossa

ESITI POSSIBILI
A) Già implementato → riporta "FATTO" + linea/blocco di codice che lo conferma. Aggiorna _ANTIGRAVITY/01_status_continui/F_ULTIMI_AGGIORNAMENTI.md aggiungendo la nota di chiusura.
B) Non ancora implementato → implementa la modifica come da StopAndGo (commenta o rimuovi la logica auto-advance). Backup non richiesto perché è modifica frontend pura. Aggiorna F_ULTIMI_AGGIORNAMENTI dopo.

STOP & GO: nel caso B, prima di scrivere il codice mostrami il blocco esatto che modificherai. Aspetto OK.
```

---

## TASK 5 — Reimport turni GemTeam

**Tipo:** F1 import dati (con backup)
**Output:** team_scheduled_shifts e team_shift_templates ripopolati
**Perché ora:** PRIORITA 2 da MASTER_STATUS, completamente indipendente dal re-import di members.

### Prompt copia-incolla per AG-F1

```
PER AG-F1 (BACKEND)

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione 03_GemTeam — PENDENTE CRITICO)
3. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_03_GemTeam.md (sezioni F1-030, F1-031)

OBIETTIVO: reimportare i turni reali da team_TURNI.xlsx in team_scheduled_shifts (attualmente 17 record, dovrebbero essere ~225) e team_shift_templates (1 → ~550). Pattern già usato in F1-030/F1-031 della chat originale 03_GemTeam.

PRE-CONDIZIONI
- File Excel disponibile in _GAE_SVILUPPO/_CLAUDE/05_allegati/03_GemTeam/ (Gaetano ha caricato lì)
- Verificare che il file sia leggibile e ha lo stesso schema di team_TURNI.xlsx usato in F1-030

METODO
1. Backup DB pre-operazione:
   mariadb-dump -u gaetano_admin -p'...' stargem_v2 team_scheduled_shifts team_shift_templates > /root/backups/gemteam_pre_reimport_$(date +%Y%m%d_%H%M).sql
2. Leggi l'Excel, normalizza nomi colonne, valida che corrisponda al pattern atteso.
3. TRUNCATE team_scheduled_shifts e team_shift_templates (operazione distruttiva — chiedi conferma a Gaetano PRIMA).
4. Reimport con apply-template pattern di F1-031 (settimana E + settimana A).
5. Verifica conteggi finali e mostra a Gaetano.

OUTPUT
1. team_scheduled_shifts e team_shift_templates ripopolati
2. Report in _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-004_reimport_turni_2026_05_11.md
3. Aggiornamento di F_ULTIMI_AGGIORNAMENTI con la chiusura del pendente "turni da reimportare"

STOP & GO IMPORTANTE
- Prima di TRUNCATE: backup completato + conferma esplicita di Gaetano
- Dopo reimport: validazione conteggi prima di marcare task chiuso
```

---

## TASK 6 — Fix UI 10_Utenti: esporre 54+ campi Athena in anagrafica

**Tipo:** F1 (API) + F2 (UI)
**Output:** API espongono i campi nascosti, UI li mostra
**Perché ora:** vedi `_CLAUDE/02_moduli_analisi/Anagrafica_FixUI_NuoviCampi_2026_05_05.md` per dettagli. ⚠️ ATTENZIONE: dipendente da TASK 1 (analisi members) — se TASK 1 raccomandasse modifiche strutturali alla tabella, andrebbe coordinato.

### Prompt copia-incolla per AG-F1+F2

```
PER AG-F1 (BACKEND) e AG-F2 (FRONTEND) — in serie, F1 prima

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (PRIORITA 1b)
3. _GAE_SVILUPPO/_CLAUDE/02_moduli_analisi/Anagrafica_FixUI_NuoviCampi_2026_05_05.md (lista completa 54+ campi)
4. _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_10_Utenti_GemPortal.md

OBIETTIVO: rendere visibili in UI i 54+ campi anagrafica importati da Athena ma attualmente non mostrati.

⚠️ PRE-CONDIZIONE: aspetta che TASK 1 (analisi members) sia completato. Se la risposta cambia la struttura di members, riadatta la lista campi.

METODO F1 (prima)
- Verifica route GET /api/members e GET /api/members/:id
- Espandi il SELECT per includere tutti i 54+ campi della sezione PRIORITA 1b in MASTER_STATUS
- Mantieni le 174 colonne totali esistenti
- Verifica con SELECT campionario che i dati siano popolati (per i record importati)

METODO F2 (dopo OK F1)
- Apri client/src/pages/anagrafica*.tsx o equivalente
- Suddividi i 54+ campi in sezioni logiche secondo il documento Anagrafica_FixUI_NuoviCampi:
  - Contatti aggiuntivi (mobile, secondary_email, email_pec)
  - Residenza completa (address, city, province, postal_code, region, nationality, birth_nation)
  - Tutori (tutor1_*, tutor2_*)
  - Consensi (consent_sms, consent_image, consent_newsletter, privacy_*)
  - Azienda (company_name, company_fiscal_code, company_city)
  - Documenti (document_type, document_expiry)
  - Bancari (bank_name, iban)
  - Misure (size_shirt, size_pants, size_shoes, height, weight)
  - Emergency contacts (3 set)
  - Educazione (education_title, education_institute)
  - Athena (fattura_fatta, athena_id, from_where)
  - Pro (p_iva, albo_*, patente_*, car_plate)
- Aggiungi badge data_quality_flag colorati per: tessera_mancante, omonimo_da_verificare, mancano_dati_obbligatori, incompleto

OUTPUT
1. server/routes.ts (o file collegati) modificato per esporre i campi
2. client/src/pages/anagrafica*.tsx modificato con nuove sezioni e badge
3. Report in _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1F2-005_anagrafica_campi_athena_2026_05_11.md

STOP & GO
- Dopo F1: mostra a Gaetano l'elenco esatto dei campi che esporrai (così conferma)
- Dopo F2 bozza: mostra screenshot/preview prima di salvare
- Backup DB non richiesto (lettura + UI). Modifiche al DB schema NON ammesse in questo task.
```

---

## ⚠️ Decisione bloccante per Gaetano (non un task AG)

Prima di passare al re-import vero e proprio di members/memberships/payments, Gaetano deve scegliere fra:
- **STRADA A** — Cassetto Flessibile (colonna `Dati_Extra` JSON in members)
- **STRADA B** — Mappatore Intelligente (DB rigido, mappature salvate)
- **STRADA A+B** — entrambe

Vedi `_ANTIGRAVITY/02_output_protocolli/StopAndGo_CampiDinamici.md` per il dettaglio.

Quando Gaetano deciderà, scriviamo il TASK 7 per implementarla.

---

*File creato da Claude (Cowork) — 2026_05_11*
