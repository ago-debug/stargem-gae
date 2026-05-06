# RECAP — Chat_12B_Gemdario
## Aggiornato: 2026-04-27 0000
## Stato: 🟡 IN COLLAUDO — deploy da fare
## Continua da: Chat_12_Gemdario (chiusa per limite immagini)
## Protocolli: F1-016 (invariato) / F2-040

---

## ⚠️ REGOLE ASSOLUTE DI QUESTA CHAT

- UI FREEZE parzialmente revocato — modifiche funzionali
  consentite su calendar.tsx, planning.tsx, attivita.tsx
  purché non stravolgano il layout
- Deploy: Antigravity git commit + git push → STOP
  Gaetano pubblica manualmente su Plesk
- Antigravity NON esegue mai: ssh VPS, npm build VPS,
  pm2 restart, deploy-vps.sh
- REGOLA FONDAMENTALE: Claude chiede analisi ad AG →
  AG risponde → Claude valuta con Gaetano → solo dopo VAI
  Il codice lo scrive sempre Antigravity

---

## STACK TECNICO

- React + TypeScript + Tailwind + React Query (frontend)
- Node.js + Drizzle ORM (backend)
- MariaDB 11.4 (database: stargem_v2, SSH tunnel porta 3307)
- VPS IONOS Ubuntu 24.04
- Dev server: localhost:5001

---

## COSA È STATO FATTO IN Chat_12B (27/04/2026)

### PENNINI — Standard Globale (3 tipi)

PENNINO A = showColors=false | NO multi-selezione | lista semplice
PENNINO B = showColors=true  | SÌ multi-selezione | lista colorata
PENNINO C = showColors=true  | NO multi-selezione | colore assegnato
             → da implementare (sessione dedicata)

Pattern Pennino A:
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button type="button" size="icon" variant="ghost" className="h-5 w-5">
      <Edit className="w-3 h-3 text-slate-500" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start"
    style={{ maxHeight: 'var(--radix-popover-content-available-height)' }}>
    <InlineListEditor listCode="CODICE" listName="Label" showColors={false} />
  </PopoverContent>
</Popover>
```

Pattern Pennino B: identico ma showColors={true} e icona sidebar-icon-gold

---

### Protocolli eseguiti in Chat_12B

**F2-031bis** — Refactor pennini A/B + rimozione modali nere
- ✅ 8 modali nere eliminate da CourseUnifiedModal.tsx
- ✅ Pennini A iniettati: Genere, Livello, FasciaEtà, Posti, NumPersone, Campus, Pacchetti
- ✅ /elenchi rimossa dalla sidebar

**F2-034** — Fix pennini A non funzionanti
- ✅ Rimosso onClick con e.preventDefault() da tutti i Button
- ✅ Aggiunto type="button" su tutti i Button pennino
- ✅ DB: system_code = 'posti_disponibili' valorizzato

**F2-035** — Fix scroll InlineListEditor
- ✅ max-h-[50vh] + overflow-y-auto sul div .map (non sul padre)
- ✅ Header/input con shrink-0 (restano fissi in cima)
- ✅ PopoverContent con maxHeight var(--radix-popover-content-available-height)
- ✅ Fix applicato a CourseUnifiedModal, multi-select-status, multi-select-internal

**F2-036** — Fix multipli + eliminazione /elenchi
- ✅ /elenchi eliminata completamente (rotta + file pages/elenchi.tsx)
- ✅ Colori Pennino B verificati (color valorizzato in DB e API)
- ✅ Rimossi riferimenti in App.tsx e utenti-permessi.tsx

**F2-037** — Seed DB + analisi turni GemTeam
- ✅ stato_iscrizione: 7 voci seed inserite con colori:
  CONFERMATA (#22c55e) · IN ATTESA (#eab308) · PROVA (#3b82f6)
  LISTA ATTESA (#f97316) · ANNULLATA (#ef4444) · SOSPESA (#8b5cf6) · COMPLETATA (#64748b)
- ⚠️ GemTeam: team_scheduled_shifts = 17 (erano 225)
  Causa: click su "Applica Template" ha fatto wipe
  → reimport da sessione dedicata

**F2-038** — Audit verifica completo (tutti ✅)

**F2-039** — Audit file orfani + problemi aperti
- ✅ /elenchi: bonifica confermata al 100%
- ✅ stato_corso: 10 voci tutte active=1 nel DB
- ✅ Badge ATTIVO default: non presente (setOpStates([]) al nuovo)
- ✅ inline-list-editor-dialog.tsx: da conservare (non è doppione)
- ⚠️ Filtro Stato Corso mancante su /attivita/corsi → risolto in F2-040
- ⚠️ Filtri Giorno + Stato mancanti su /attivita/lezioni-individuali → risolto in F2-040
- ⚠️ CustomListManagerDialog ancora vivo in multi-select-custom-list.tsx → risolto in F2-040

**F2-040** — Fix filtri + cleanup CustomListManagerDialog
- ✅ CustomListManagerDialog eliminato definitivamente
- ✅ Filtro Stato Corso aggiunto su /attivita/corsi
- ✅ Filtri Giorno + Stato aggiunti su /attivita/lezioni-individuali

---

## 📋 CHECKLIST COMPLETA

### ✅ COMPLETATO

| Task | Protocollo |
|------|-----------|
| Eliminazione 8 modali nere CourseUnifiedModal | F2-031bis |
| Pennini A funzionanti (click + Popover) | F2-034 |
| Fix scroll liste InlineListEditor | F2-035 |
| Colori Pennino B (Stato/Interno Corso) | F2-036 |
| /elenchi eliminata completamente | F2-036 |
| CustomListManagerDialog eliminato | F2-040 |
| Filtro Stato Corso su /attivita/corsi | F2-040 |
| Filtri Giorno+Stato su lezioni individuali | F2-040 |
| DB: stato_iscrizione seed 7 voci con colori | F2-037 |
| DB: system_code posti_disponibili valorizzato | F2-034 |
| B3bis: corsi nascosti su festivi/domeniche | Chat_12 |

### 🟡 DA VERIFICARE (post deploy)

| Task | Note |
|------|------|
| Scroll pennini visivo in produzione | deploy da fare |
| Colori Pennino B visivi in produzione | deploy da fare |
| Nuovi filtri visivi in produzione | deploy da fare |

### ⬜ PENDENTI

| Task | Note |
|------|------|
| Deploy Plesk F2-034→040 | priorità immediata |
| Pennino C (categorie con colori) | sessione dedicata |
| GemTeam turni reimport (17→225) | sessione dedicata |
| Raggruppamento corsi Planning (PM8) | bug MASTER aperto |
| Refactoring calendar.tsx (3.500 righe) | sessione dedicata |
| Navigazione history + breadcrumb | tutte le pagine |

---

## AGGIORNAMENTO MASTER_STATUS

```
## 12_Gemdario — aggiornato 2026-04-27 0000
Stato: 🟡 In collaudo
Ultimo protocollo: F1-016 / F2-040
Tabelle DB toccate:
  custom_lists: system_code posti_disponibili valorizzato
  custom_list_items: seed stato_iscrizione (7 voci con colori)
Lavori completati in Chat_12B:
  - Eliminazione 8 modali nere da CourseUnifiedModal
  - Pennini A funzionanti (fix preventDefault + type=button)
  - Fix scroll InlineListEditor (max-h sul div .map)
  - Colori Pennino B verificati (Stato Corso + Interno Corso)
  - /elenchi eliminata completamente (rotta + file + sidebar)
  - CustomListManagerDialog eliminato
  - Filtro Stato Corso aggiunto su /attivita/corsi
  - Filtri Giorno + Stato aggiunti su lezioni individuali
  - stato_iscrizione: 7 voci seed inserite nel DB
Pendenti:
  - Deploy Plesk (F2-034→040 da portare in produzione)
  - Verifica visiva post-deploy
  - Pennino C (categorie colori) → sessione dedicata
  - GemTeam turni reimport → sessione dedicata
  - Raggruppamento corsi Planning (bug MASTER)
  - Refactoring calendar.tsx → sessione dedicata
  CONTINUARE IN: Chat_12B_Gemdario
```

---

## COME APRIRE LA PROSSIMA SESSIONE Chat_12B

```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_12B_Gemdario — continuazione attiva.

Leggi dal Progetto Claude:
- MASTER_STATUS.md (versione più recente)
- 2026_04_27_0000_RECAP_Chat12B_Gemdario.md (questo file)
- A→G file GAE_SVILUPPO (versione più recente)

PRIMA COSA DA FARE:
1. Verificare se deploy Plesk è stato eseguito
2. Verificare visivamente scroll pennini + colori + filtri
3. Poi decidere con Gaetano cosa affrontare

Dev: localhost:5001
DB: stargem_v2 porta 3307
Protocolli: continuano da F1-016 / F2-040
```
