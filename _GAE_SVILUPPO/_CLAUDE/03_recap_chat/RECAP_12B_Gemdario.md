# RECAP_12B_Gemdario
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_27_0000)
> Stato chat: 🟡 IN COLLAUDO — deploy F2-034→040 da fare
> Ultimo protocollo: F1-016 / F2-040

---

## 1. SCOPO E PERIMETRO

Modulo del calendario operativo (Gemdario) e del planning strategico.
Continua il lavoro di Chat_12_Gemdario (chiusa per limite immagini).
Governa: vista calendario giornaliera/settimanale, planning multi-stagione,
strategic_events, festività, custom_lists per pennini A/B/C, scheda corso
con iscritti, raggruppamento corsi, modale unificato CourseUnifiedModal,
TimeSlotPicker, PaymentModuleConnector.

NON gestisce: iscrizioni base (vedi Chat_08), pagamenti (vedi Chat_06),
turni dipendenti GemTeam (vedi Chat_03 — turni reimport pendente),
struttura courses (STI fissa, non si tocca).

Visibile a: admin, operator, segreteria.

---

## 2. STATO ATTUALE

### Cosa è già fatto (in Chat_12B il 27/04)

**F2-031bis — Refactor pennini A/B + rimozione modali nere**
- 8 modali nere eliminate da `CourseUnifiedModal.tsx`
- Pennini A iniettati: Genere, Livello, FasciaEtà, Posti, NumPersone,
  Campus, Pacchetti
- `/elenchi` rimossa dalla sidebar

**F2-034 — Fix pennini A non funzionanti**
- Rimosso `onClick` con `e.preventDefault()` da tutti i Button
- Aggiunto `type="button"` su tutti i Button pennino
- DB: `system_code='posti_disponibili'` valorizzato

**F2-035 — Fix scroll InlineListEditor**
- `max-h-[50vh]` + `overflow-y-auto` sul div .map (non sul padre)
- Header/input con `shrink-0` (restano fissi in cima)
- `PopoverContent` con `maxHeight var(--radix-popover-content-available-height)`
- Fix applicato a CourseUnifiedModal, multi-select-status, multi-select-internal

**F2-036 — Fix multipli + eliminazione /elenchi**
- `/elenchi` eliminata completamente (rotta + file `pages/elenchi.tsx`)
- Colori Pennino B verificati (color valorizzato in DB e API)
- Rimossi riferimenti in `App.tsx` e `utenti-permessi.tsx`

**F2-037 — Seed DB + analisi turni GemTeam**
- `stato_iscrizione`: 7 voci seed inserite con colori:
  CONFERMATA (#22c55e) · IN ATTESA (#eab308) · PROVA (#3b82f6) ·
  LISTA ATTESA (#f97316) · ANNULLATA (#ef4444) · SOSPESA (#8b5cf6) ·
  COMPLETATA (#64748b)
- ⚠️ GemTeam: `team_scheduled_shifts=17` (erano 225) — wipe da test

**F2-038 — Audit verifica completo (tutti ✅)**

**F2-039 — Audit file orfani + problemi aperti**
- `/elenchi` bonifica confermata 100%
- `stato_corso`: 10 voci tutte `active=1`
- Badge ATTIVO default: non presente
- `inline-list-editor-dialog.tsx`: da conservare (non doppione)
- ⚠️ Filtro Stato Corso mancante su `/attivita/corsi` → risolto in F2-040
- ⚠️ Filtri Giorno + Stato mancanti su `/attivita/lezioni-individuali`
  → risolto in F2-040
- ⚠️ `CustomListManagerDialog` ancora vivo → risolto in F2-040

**F2-040 — Fix filtri + cleanup CustomListManagerDialog**
- `CustomListManagerDialog` eliminato definitivamente
- Filtro Stato Corso aggiunto su `/attivita/corsi`
- Filtri Giorno + Stato aggiunti su `/attivita/lezioni-individuali`

### Cosa è in corso
- DEPLOY su Plesk dei protocolli F2-034→040 (sequenza chiusa
  ma non ancora pubblicata in produzione)

### Cosa è bloccato
- Verifica visiva post-deploy (scroll pennini, colori Pennino B,
  nuovi filtri)

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record (28/04) | Note |
|---|---|---|---|
| `courses` | catalogo corsi STI | 602 | era 586 il 25/04 — delta +16 da chiarire |
| `enrollments` | iscrizioni | 12.234 | delta −1.350 da chiarire (vedi RECAP_08) |
| `strategic_events` | eventi planning | 74 | festività + chiusure + saggi |
| `custom_lists` | dizionari | 35 | sistema pennini |
| `custom_list_items` | voci dizionari | 297 | seed completo (+ 7 stato_iscrizione) |
| `studios` | sale | 13 | stabile |
| `seasons` | stagioni | 3 | stabile |

---

## 4. FILE CHIAVE NEL CODEBASE

- `client/src/pages/calendar.tsx` — calendario operativo (3.500 righe — refactoring pendente)
- `client/src/pages/planning.tsx` — planning multi-stagione
- `client/src/pages/attivita.tsx` — attività hub
- `client/src/pages/attivita/corsi.tsx` — lista corsi
- `client/src/pages/attivita/lezioni-individuali.tsx`
- `client/src/pages/scheda-corso.tsx` — scheda corso con iscritti
- `client/src/components/CourseUnifiedModal.tsx` — modale unificato corsi
- `client/src/components/InlineListEditor.tsx` — Pennino A/B globale
- `client/src/components/multi-select-status.tsx`
- `client/src/components/multi-select-internal.tsx`
- `client/src/components/TimeSlotPicker.tsx`
- `client/src/components/PaymentModuleConnector.tsx` — ⚠️ SENSIBILE 14 route
- `shared/schema.ts` § courses + § strategic_events + § custom_lists

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — Pennino C (categorie con colori)
- **Cosa decidere:** struttura del Pennino C (showColors=true,
  no multi-selezione, colore assegnato)
- **Stato:** ⏳ aperta — sessione dedicata

### Decisione 2 — Refactoring `calendar.tsx`
- **Cosa decidere:** strategia di scomposizione del file da 3.500 righe
- **Stato:** ⏳ aperta — sessione dedicata

### Decisione 3 — Raggruppamento corsi nel Planning
- **Stato:** ⏳ aperta — bug noto (raggruppamento sparito da Chat_12)

### Decisione 4 — Navigazione history + breadcrumb
- **Stato:** ⏳ aperta — tutte le pagine

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1) — invariato da Chat_12
- F1-001 → F1-016 — ✅ chiusi (vedi RECAP_12 Chat_12 originale)
- F1-017+ — non ancora emessi in Chat_12B (UI work-only)

### Frontend (F2) — Chat_12B
- F2-031bis — ✅ pennini A/B + rimozione modali nere
- F2-032/033 — (numeri saltati o in Chat_12)
- F2-034 — ✅ fix pennini A
- F2-035 — ✅ fix scroll InlineListEditor
- F2-036 — ✅ fix multipli + eliminazione /elenchi
- F2-037 — ✅ seed DB stato_iscrizione + analisi turni
- F2-038 — ✅ audit verifica
- F2-039 — ✅ audit orfani
- F2-040 — ✅ fix filtri + cleanup CustomListManagerDialog

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] **DEPLOY Plesk F2-034→040** — priorità immediata
2. [ ] Verifica visiva post-deploy: scroll pennini, colori Pennino B,
   nuovi filtri Stato Corso/Giorno/Stato
3. [ ] **Pennino C** (categorie con colori) — sessione dedicata
4. [ ] **GemTeam turni reimport** (17 → 225) — sessione dedicata
   (è un task di Chat_03_GemTeam, non di Gemdario)
5. [ ] **Raggruppamento corsi nel Planning** (bug MASTER) — investigare
6. [ ] **Refactoring `calendar.tsx`** (3.500 righe) — sessione dedicata
7. [ ] Navigazione history + breadcrumb — tutte le pagine
8. [ ] Festività italiane 2026 (ANALISI_MASTER segnala completamento pendente)
9. [ ] Overlay Programmazione Date in shift grid (sessione dedicata)

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_12_Gemdario** — chiusa per limite immagini, da cui questa chat
  continua. Non aprire più Chat_12, lavorare in Chat_12B.
- **Chat_03_GemTeam** — il bug `team_scheduled_shifts=17` (erano 225)
  scoperto in F2-037 va risolto in Chat_03 (reimport turni reali).
- **Chat_08_Corsi** — il calendario fa JOIN con `enrollments`. Il delta
  −1.350 record di enrollments tra 25/04 e 28/04 va chiarito da Chat_08.
- **Chat_06_Contabilità** — `PaymentModuleConnector` è invocato dal
  calendario per pagamenti rapidi. NON toccare il connector.
- **Chat_05_GemPass** — la scheda corso fa JOIN con `memberships` per
  mostrare lo stato tessera dell'iscritto.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **UI FREEZE** parzialmente revocato — modifiche funzionali consentite
  su `calendar.tsx`, `planning.tsx`, `attivita.tsx` purché non stravolgano
  il layout.
- **PaymentModuleConnector** — SENSIBILE — non toccare (14 route impattate).
- **Pennini standard globale (3 tipi):**
  - PENNINO A = `showColors=false` | NO multi-selezione | lista semplice
  - PENNINO B = `showColors=true` | SÌ multi-selezione | lista colorata
  - PENNINO C = `showColors=true` | NO multi-selezione | colore assegnato
    (DA IMPLEMENTARE)
- **Pattern Pennino A** (riferimento):
  ```tsx
  <Popover>
    <PopoverTrigger asChild>
      <Button type="button" size="icon" variant="ghost" className="h-5 w-5">
        <Edit className="w-3 h-3 text-slate-500" />
      </Button>
    </PopoverTrigger>
    <PopoverContent ...>
      <InlineListEditor listCode="CODICE" listName="Label" showColors={false} />
    </PopoverContent>
  </Popover>
  ```
- **`/elenchi` ELIMINATA completamente** (rotta + file). Le liste si
  gestiscono solo dai pennini inline o dal pannello admin custom_lists.
- **`CustomListManagerDialog` ELIMINATO** — non riportarlo in vita.
- **Backup pre-Chat_12B**: dal RECAP non risulta esplicito — verificare
  con AG il backup attivo per F1-016.
- **Festività 2026** in `strategic_events` da completare.
- **Bug timezone confermato**: `new Date("YYYY-MM-DD")` converte in UTC
  e può rompere query date-filtered. Pattern fixato con `setHours(12,0,0,0)`.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat12B_Gemdario_2026_04_27_0000 + memoria progetto*
