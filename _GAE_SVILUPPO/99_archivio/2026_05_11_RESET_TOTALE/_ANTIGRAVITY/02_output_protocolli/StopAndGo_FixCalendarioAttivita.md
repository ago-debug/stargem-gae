# Report Stop & Go: Fix Navigazione Iniziale Calendario Attività

**Data**: 04 Maggio 2026

## 1. Modifica Proposta
Rimuovere (o commentare) la logica di "Auto-advance" della stagione all'interno del file `client/src/pages/calendar.tsx` (Calendario Attività operativo). 

Attualmente, il codice controlla se il mese corrente è compreso tra Febbraio e Luglio. Se lo è, forza la visualizzazione della stagione *successiva* (nel nostro caso 2026/2027) ignorando la data odierna. Verrà disabilitato questo blocco per far sì che il calendario si apra sempre sulla data corrente.

## 2. Perché Serve
Il "Calendario Attività" è una vista operativa. L'utente ha segnalato che entrando nel calendario viene portato automaticamente al 31 Agosto (inizio della stagione successiva). Per le operazioni quotidiane (presenze, iscrizioni, etc.) la segreteria ha bisogno di atterrare sul **giorno e orario corrente** (Oggi).

## 3. File Coinvolti
- `client/src/pages/calendar.tsx`

## 4. Impatti Previsti
- **Positivo**: Entrando nella pagina `/calendario-attivita`, il sistema caricherà di default la data odierna.
- L'utente non dovrà più scorrere manualmente indietro di mesi per vedere le attività di oggi.

## 5. Rischi / Regressioni
- **Nessuno sulla vista operativa**. 
- La logica di "auto-generazione" della nuova stagione, che era annidata in questo blocco, verrà anch'essa congelata qui. Se è necessaria, andrà spostata o lasciata attiva *solo* nel modulo di "Planning Strategico" (che ha senso sia proiettato al futuro), mentre il Calendario Operativo resterà ancorato al presente.

## 6. Cosa NON verrà toccato
- Non verranno toccati i filtri, il salvataggio o la modifica degli eventi.
- Non verrà modificato il backend.
- Non verrà modificato il "Planning Strategico" (`planning.tsx`).

---
**ATTESA APPROVAZIONE**: Confermi di procedere con questa modifica al file `calendar.tsx`?
