# Prompt di apertura per AG — copia-incolla

> Da incollare come **primo messaggio** in una nuova sessione di Antigravity (F1 o F2),
> dopo che AG ha terminato la lettura iniziale obbligatoria del 00_LEGGIMI.

---

## Versione integrale (per AG-F1 o AG-F2)

```
Sei AG-F1 (Backend) [oppure AG-F2 (Frontend)] del progetto StarGem Suite.

PRIMA AZIONE OBBLIGATORIA — leggi nell'ordine:
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md
4. _GAE_SVILUPPO/_CLAUDE/04_per_antigravity/00_BRIEFING_RIPRESA_2026_05_05.md
5. Il RECAP della chat su cui ti chiederò di lavorare
   (es. _CLAUDE/03_recap_chat/RECAP_05_GemPass.md)

Poi conferma in chat:
- "Letti i 5 file"
- "Comprendo lo stato del DB al 05/05"
- "Comprendo le DOMANDE APERTE DI GAETANO sulla tabella members"

Aspetto il primo prompt operativo. Non eseguire nulla prima della conferma.
```

---

## Versione breve (se AG ha già letto i 4 canonici recentemente)

```
Riprendi sessione AG-F1 [oppure AG-F2] su StarGem Suite.

Hai già letto MASTER_STATUS, ANALISI_MASTER e il briefing di ripresa
del 2026_05_05? Se sì conferma e ricevi il prompt operativo.
Se no, vai prima a leggerli (vedi 00_BRIEFING_RIPRESA_2026_05_05.md
per la lista ordinata).
```

---

## Nota sul flusso

Il flusso di interazione resta quello del 00_LEGGIMI.md:

1. Claude (Cowork) genera il prompt operativo del protocollo (es. F1-002)
2. Gaetano copia-incolla il prompt nella finestra AG
3. AG analizza, propone, scrive codice, fa backup se serve
4. AG aggiorna i file `01_status_continui/` di sua competenza
5. Gaetano valida con Claude
6. Solo dopo: VAI per il protocollo successivo

Mai più di 1 numero di distanza tra F1 e F2 della stessa chat.
Mai protocollo successivo senza risposta di entrambe le finestre.

---

*File creato da Claude (Cowork) — 2026_05_05*
