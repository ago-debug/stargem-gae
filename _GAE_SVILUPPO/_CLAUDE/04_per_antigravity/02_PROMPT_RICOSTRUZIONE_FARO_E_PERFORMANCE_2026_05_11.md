---
tags: [antigravity, faro, ricostruzione, performance, post-reset]
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
tipo: prompt-operativo
---

# Prompt Step S (Ricostruzione Faro AG) + Step P (Performance & File Pesanti) — 2026_05_11

> Collegati: [[MASTER_STATUS]] · `00_LEGGIMI.md` (regole 15 tracciabilità + 16 validità temporale)

## Contesto

Dopo il reset totale dell'11/05, AG ha perso i suoi 10 file vivi `_ANTIGRAVITY/01_status_continui/A→Z` che servivano come **bibbia del contesto** ad ogni sessione. Vanno ricostruiti con dati FRESCHI basandosi sui due audit `stato_di_fatto_F1_backend_2026_05_11.md` e `stato_di_fatto_F2_frontend_2026_05_11.md` di stamattina.

Più, Gaetano richiede 2 viste nuove che mancavano:
- mappa **file più pesanti** (LOC, bundle size, query lente)
- proposte concrete di **dove velocizzare** il sistema

---

## 🔦 STEP S — Ricostruzione faro AG (F1 + F2 in parallelo)

### S.1 Incolla in AG-F1 (Backend faro)

```
PER AG-F1 (BACKEND) — RICOSTRUZIONE FARO _ANTIGRAVITY/01_status_continui/

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso articolo 15 tracciabilità + articolo 16 validità temporale)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md (tuo audit di stamattina)

OBIETTIVO: ricostruire 5 file vivi in _ANTIGRAVITY/01_status_continui/ dividendo il contenuto del tuo audit di stamattina per area. Questi sono il faro permanente per le tue future sessioni — vanno aggiornati ad ogni Stop&Go come da regola 15.

FILE DA CREARE/AGGIORNARE (tutti in _ANTIGRAVITY/01_status_continui/)

1. **A_2026_05_11_Architettura_Core_Server.md**
   - Schema server (Express, Vite, Drizzle ORM, passport)
   - Struttura cartelle server/, shared/, scripts/, migrations/
   - Route principali raggruppate per dominio (/api/auth, /api/members, /api/gemteam, /api/courses, /api/payments, /api/quote-promo, /api/stats, /api/ai, /api/import-export)
   - Middleware attivi (auth, logger winston, rate-limit, Sentry)
   - Frontmatter conforme regola 16: aggiornato + ultima_verifica_vs_codice + validita_prevista (3 giorni per A_ è ragionevole)

2. **C_2026_05_11_Stato_Lavori_e_Briefing.md**
   - Sintesi del tuo audit: cosa funziona, cosa è in corso, cosa è bloccante
   - Le 5 macro-sezioni identificate (Auth, GemTeam, Anagrafica, Corsi/STI, Cassa/Pagamenti) con 2-3 righe ciascuna
   - I 4 errori TS bloccanti come priorità #0
   - Cosa Gaetano vuole stabilizzare nelle prossime settimane (Anagrafica > Pagamenti > Calendario)

3. **D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND.md**
   - Per ogni tabella DB: schema + record reali + FK in entrata e in uscita
   - Mappa "tabella → route che la usa" → "frontend page che la consuma"
   - Migrazioni recenti (0012 → 0015 di aprile)
   - Tabelle morte/orfane (es. global_enrollments che lancia "Table doesn't exist")

4. **G_2026_05_11_Checklist_Operativa_F1.md**
   - Lista delle cose backend da fare in ordine di priorità (P0 fix TS condiviso, P1 Anagrafica refactor JOIN, P2 Pagamenti disaccoppiamento, ecc.)
   - Per ogni voce: stima ore + dipendenze + rischio

5. **F_2026_05_11_<HHMM>_ULTIMI_AGGIORNAMENTI.md** (timestamp corrente)
   - Prima entry: "11/05 — Reset totale completato, audit stato di fatto F1+F2 prodotti, faro ricostruito."
   - Da qui in avanti, ogni tuo Stop&Go aggiunge una nota in cima (regola 15)

REGOLE
- I file possono ATTINGERE dal tuo audit di stamattina (è la fonte verificata).
- Frontmatter obbligatorio su tutti (regola 16):
  ```yaml
  ---
  aggiornato: 2026-05-11
  ultima_verifica_vs_codice: 2026-05-11
  validita_prevista: N giorni
  fonti_verificate:
    - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md
  ---
  ```
- Read-only sul codice: zero modifiche. Solo lettura + scrittura dei 5 file in 01_status_continui.
- Validazione regola 14: npx tsc --noEmit a fine (anche se non hai toccato codice produttivo, serve a confermare che la baseline è ok).
- Tracciabilità regola 15: l'F_ è il primo aggiornato e contiene la nota di chiusura task.

STOP & GO: niente modifiche al codice produttivo. Solo creazione dei 5 file di status.
```

### S.2 Incolla in AG-F2 (Frontend faro)

```
PER AG-F2 (FRONTEND) — RICOSTRUZIONE FARO _ANTIGRAVITY/01_status_continui/

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso articolo 15 tracciabilità + articolo 16 validità temporale)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md (tuo audit di stamattina)

OBIETTIVO: ricostruire 4 file vivi in _ANTIGRAVITY/01_status_continui/ dividendo il contenuto del tuo audit di stamattina per area. Questi sono il faro permanente per le tue future sessioni — vanno aggiornati ad ogni Stop&Go come da regola 15.

FILE DA CREARE/AGGIORNARE

1. **B_2026_05_11_Frontend_Moduli.md**
   - Struttura cartella client/src/ (pages, components, hooks, lib, contexts, styles)
   - Le 5 macro-sezioni UI (Calendario&Planning, CRM/Maschera Input, Corsi&Attività, Contabilità&Pagamenti, Utilità&AI)
   - Per ogni macro-sezione: file chiave + componenti shadcn usati + dipendenze interne
   - Frontmatter conforme regola 16

2. **D_2026_05_11_Mappa_Dati_e_Frontend_FRONTEND.md**
   - Mappa pagina → endpoint API consumati
   - Mappa componente → state usato (CrmFormContext, ecc.)
   - Custom hooks rilevanti
   - Dove sono i ricalcoli locali vs lettura backend (importante per pagamenti)

3. **H_2026_05_11_Design_System.md**
   - Configurazione Tailwind (token, palette stargem-red, text-xxs, ecc.)
   - Componenti shadcn installati e patternati (Card, Sheet, Dialog, Tabs, ecc.)
   - Pattern UX consolidati (pennini A/B inline-list-editor, ExportWizard, scheda-corso pattern, badge status)
   - ESLint rules attive contro arbitrary values

4. **G_2026_05_11_Checklist_Operativa_F2.md**
   - Lista cose frontend da fare in ordine di priorità (P0 fix 4 TS, P1 Anagrafica spacchettamento, P2 Calendar refactor, ecc.)
   - Per ogni voce: stima ore + dipendenze + rischio regressione

REGOLE
- I file ATTINGONO dal tuo audit di stamattina (fonte verificata).
- Frontmatter obbligatorio (regola 16):
  ```yaml
  ---
  aggiornato: 2026-05-11
  ultima_verifica_vs_codice: 2026-05-11
  validita_prevista: N giorni
  fonti_verificate:
    - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md
  ---
  ```
- Read-only sul codice produttivo.
- Validazione regola 14 + tracciabilità regola 15 (aggiungi nota in F_ se non c'è ancora, F1 lo crea in parallelo).

STOP & GO: niente modifiche al codice produttivo. Solo i 4 file di status.
```

---

## ⚡ STEP P — Mappa file pesanti & dove velocizzare (F1 + F2 in parallelo)

Da lanciare DOPO che Step S è chiuso. Richiede i file vivi appena ricostruiti come base.

### P.1 Incolla in AG-F1 (Performance Backend)

```
PER AG-F1 (BACKEND) — AUDIT PERFORMANCE & FILE PESANTI

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/A_2026_05_11_Architettura_Core_Server.md (tuo, appena creato in Step S)
4. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND.md (tuo)

OBIETTIVO: produrre una mappa concreta dei "punti grassi" del backend e proposte di ottimizzazione.

DATI DA RACCOGLIERE (read-only, niente modifiche)

1. **File backend più pesanti per LOC** (top 15):
   wc -l server/**/*.ts shared/**/*.ts | sort -rn | head -20
   Per i top 5: di cosa si occupa, perché è così pesante, è splittabile.

2. **Query SQL più costose** (se hai modo di farlo):
   - Tramite EXPLAIN su query rappresentative dei moduli più carichi (members, courses, enrollments)
   - O semplicemente identifica le route con JOIN multipli sopra le 3 tabelle
   - Indica quelle che potrebbero diventare lente con 10× i dati

3. **Indici mancanti** o sospetti:
   - SHOW INDEXES su tabelle critiche
   - Identifica colonne usate in WHERE/JOIN che NON hanno indice

4. **Dipendenze npm sopra peso** (server-side):
   - Quali sono i 5 pacchetti più pesanti in node_modules che impattano la build server
   - Esistono alternative più leggere?

5. **Endpoints lenti noti** (se hai modo di vedere log winston/Sentry/PostHog):
   - Top 5 endpoint per tempo di risposta medio (se i log lo dicono)
   - Eventuali N+1 problem nel codice (es. query in loop)

DELIVERABLE
File: _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/Z_2026_05_11_Performance_File_Pesanti_BACKEND.md

Struttura:
## A. File backend più pesanti (top 15 per LOC)
## B. Query critiche e indici mancanti
## C. Dipendenze npm pesanti server-side
## D. Endpoints lenti noti
## E. PROPOSTE DI OTTIMIZZAZIONE (in ordine di rapporto valore/sforzo)
   - Quick wins (<1 giorno, alto impatto)
   - Medium effort (1-3 giorni)
   - Big bets (>3 giorni)

Frontmatter standard regola 16. Tracciabilità regola 15. Validazione regola 14.

STOP & GO: zero modifiche.
```

### P.2 Incolla in AG-F2 (Performance Frontend)

```
PER AG-F2 (FRONTEND) — AUDIT PERFORMANCE & FILE PESANTI

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/B_2026_05_11_Frontend_Moduli.md (tuo, appena creato in Step S)

OBIETTIVO: produrre una mappa dei "punti grassi" del frontend e proposte di ottimizzazione.

DATI DA RACCOGLIERE (read-only)

1. **File frontend più pesanti per LOC** (top 15):
   wc -l client/src/**/*.tsx client/src/**/*.ts | sort -rn | head -20
   I monoliti noti (maschera-input-generale.tsx 4.5k, calendar.tsx 3.5k) ovviamente in cima. Per i top 5: dove sono le concentrazioni di logica, dove tagliare per primi.

2. **Bundle size**:
   - npm run build → controlla la stat di Vite (dimensioni dei chunk)
   - I 5 chunk JS più pesanti dopo la build
   - File JS che dovrebbero essere splittati con lazy loading ma non lo sono

3. **Componenti che ri-renderano troppo**:
   - Grep di componenti senza React.memo o useMemo dove sarebbero giustificati
   - Context provider con stato che cambia spesso e fa esplodere i consumer

4. **Dipendenze npm pesanti client-side**:
   - Top 5 pacchetti più pesanti dal bundle analyzer (se hai vite-bundle-visualizer o equivalente)
   - Possibili sostituzioni più leggere

5. **Immagini e asset statici**:
   - Sono ottimizzati? (es. PNG vs WebP, dimensioni elevate)
   - Lazy loading?

DELIVERABLE
File: _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/Z_2026_05_11_Performance_File_Pesanti_FRONTEND.md

Struttura:
## A. File frontend più pesanti (top 15 per LOC)
## B. Bundle size attuale per pagina/chunk
## C. Componenti con re-render eccessivi (sospetti)
## D. Dipendenze npm pesanti client-side
## E. Asset statici da ottimizzare
## F. PROPOSTE DI OTTIMIZZAZIONE in ordine valore/sforzo
   - Quick wins
   - Medium effort
   - Big bets

Frontmatter standard regola 16. Tracciabilità regola 15. Validazione regola 14.

STOP & GO: zero modifiche.
```

---

## Sequenza consigliata di esecuzione

| Ordine | Step | Chi | Parallelo? | Output principale |
|---|---|---|---|---|
| 1 | **S** Ricostruzione faro | F1 + F2 | ✅ in parallelo tra loro | 9 file in `_ANTIGRAVITY/01_status_continui/` |
| 2 | **A** Fix 4 errori TS | F2 | ✅ in parallelo a S backend | 0 errori TS |
| 3 | **P** Performance & file pesanti | F1 + F2 | ✅ in parallelo tra loro, DOPO S+A | 2 file `Z_*_Performance_*` |
| 4 | **B** Audit Anagrafica approfondito | F1 + F2 | ✅ in parallelo tra loro, DOPO S+A | 2 file audit Anagrafica |
| 5 | Refactor Anagrafica (piano costruito su B) | F1 + F2 | misto | Codice rivisitato |

Step S è il **prerequisito** di tutto perché AG ha bisogno del faro per orientarsi. Dopo S, gli altri step possono incastrarsi.

---

*Prompt creati da Claude (Cowork) — 2026_05_11 — basati su audit verificati stamattina (regola 16 freschezza)*
