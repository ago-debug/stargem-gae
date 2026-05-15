---
aggiornato: 2026-05-12T02:50
ultima_verifica_vs_codice: 2026-05-12T02:50
tipo: indice-segnalazioni
---

# 📸 _segnalazioni/ — Bug e migliorie segnalate da Gaetano usando il sito live

Cartella dove Gaetano carica screenshot/video delle cose che nota usando il gestionale in produzione o in dev.

## Convenzione naming

`SEG-NNN_<area>_<descrizione_breve>.png` (oppure `.mov`, `.pdf`, ecc.)

Esempi:
- `SEG-001_anagrafica_pulsante_salva_disattivo.png`
- `SEG-002_calendario_corsi_mancanti_settimana.png`
- `SEG-003_pagamenti_modale_chiude_da_sola.png`

NNN = progressivo (001, 002, 003...). Se Gaetano è in dubbio scrive `SEG-XXX_...` e Claude rinumera.

## Workflow

1. Gaetano carica file qui
2. Gaetano scrive in chat Cowork: screenshot + 2 righe di problema
3. Claude aggiunge voce in `_CLAUDE/01_canonici/CHECKLIST_PROGETTO.md` sezione "Segnalazioni dal sito live" con identificatore SEG-NNN, link al file, descrizione, stato iniziale 🟡 aperta
4. Quando il fix è in lavorazione, lo stato passa a 🟡 in indagine / 🟢 in corso fix
5. Quando chiuso: ✅ chiuso + riferimento al protocollo F1-NNN o F2-NNN che ha risolto

AG legge questa cartella in sola lettura. Quando arriva il momento di fixare SEG-NNN, AG apre lo screenshot + legge la voce checklist.

