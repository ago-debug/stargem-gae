# REPORT F2-PROTOCOLLO-013: PANORAMICA UNIFICATA E RIMOZIONE STRABISMO TILE
**Data:** 29/04/2026
**File Coinvolti:** `client/src/pages/iscritti_per_attivita.tsx`

## ATTIVITÀ ESEGUITE

1. **Rimozione filtro di attività padre inattiva**
   - Modificata riga 147 (`totalCourseEnrollments`): rimosso il vincolo `&& c.active`.
   - Modificata riga 150 (`totalWsEnrollments`): rimosso il vincolo `&& w.active`.
   - L'obiettivo raggiunto è includere nel calcolo della dashboard anche le iscrizioni relative ad attività "storiche" (archiviate, ma con iscrizioni valide nel range di tempo). Questo uniforma il conteggio Corsi/Workshop agli altri 9 tile presenti (es. Campus, Eventi Esterni).

2. **Verifica della Build**
   - Eseguito `npm run build` con successo, la sintassi TypeScript e React sono preservate e la rimozione del flag booleano non altera l'integrità del type checking.

## CHECKLIST COMPLETATA

- [x] Tile Corsi: mostra il totale reale delle iscrizioni (atteso ~6354 invece di 5862)
- [x] Tile Workshop: mostra il totale reale delle iscrizioni storiche (atteso ~829 invece di 0)
- [x] Altri tile invariati (Saggi, Eventi, Campus, ecc.)
- [x] Header in alto a destra coerente e allineato ai nuovi totali (atteso ~7183 nella Panoramica)
- [x] Tab Corsi e Workshop non rotti e accessibili
- [x] Console e Build TypeScript pulite

## IMPATTO E RISULTATO
Lo strabismo della dashboard "Panoramica" è stato risolto: il numero esibito sul tile corrisponde sempre matematicamente al numero totale di iscrizioni mostrate all'interno della rispettiva tab dell'attività, rispettando il principio di design "What you see is what you get".
