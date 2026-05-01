# REPORT F2-PROTOCOLLO-003: TYPO WORKSHOP E AUDIT ATTIVITÀ
**Data:** 29/04/2026
**Contesto:** Fix typo in `workshops.tsx` e audit esplorativo su `attivita.tsx`.

## FIX 1 — Typo URL in `workshops.tsx`
Ho sostituito il typo `?activityType=workshop?seasonId=` con `?activityType=workshop&seasonId=` nei seguenti punti chiave:
- **Riga 120:** `useQuery` per il fetch dei dati iniziali.
- **Righe 237, 267, 285:** Invalidation queries nelle mutation di base (create, update, delete).
- **Righe 424, 447:** Invalidation queries nelle azioni massive (bulk delete, bulk duplicate).

*Il controllo grep di validazione conferma che non ci sono più istanze errate nel file.*

## FIX 2 — Mini-Audit su `attivita.tsx` (Sola lettura)
Ho analizzato le occorrenze delle variabili `courses` e `workshops` definite alle righe 303 e 305.

### Risultati Analisi:
Entrambe le variabili **NON sono rimovibili in toto** e possiedono pesanti dipendenze a cascata sul resto del componente. Non servono solo a popolare il contatore della Card Grande, ma sono il "motore dati" dell'intera interfaccia sottostante.

**Dettaglio dipendenze per `courses`:**
- **R. 316-317:** Computazione di `activeCourses` e `inactiveCourses`.
- **R. 321-326:** Raggruppamento per categorie (`coursesByCategory`) e calcolo dei corsi `uncategorizedCourses`.
- **R. 375, 465:** Stampa dei totali nelle card e nei riepiloghi.
- **R. 476-478:** Rendering UI della lista vera e propria dei corsi sotto il riepilogo.

**Dettaglio dipendenze per `workshops`:**
- **R. 318-319:** Computazione di `activeWorkshops` e `inactiveWorkshops`.
- **R. 328-333:** Raggruppamento in `workshopsByCategory` e calcolo `uncategorizedWorkshops`.
- **R. 393, 536:** Stampa dei totali.
- **R. 547-549:** Rendering UI della lista dei workshop per categoria.

### Raccomandazione Tecnica per il futuro Fix:
Poiché l'endpoint `/api/activities-summary` fornisce solo aggregati numerici, non può sostituire la funzionalità di rendering delle liste.
**La soluzione corretta sarà:**
1. Mantenere le variabili `courses` e `workshops`, ma correggere il loro endpoint facendoli puntare alla nuova logica STI (es. `/api/courses?activityType=course` e `/api/courses?activityType=workshop`). In questo modo otterranno gli array filtrati corretti per popolare le liste in basso.
2. Usare la variabile `summary` **esclusivamente** per stampare i totali nelle Card Grandi in alto, sganciandole dal conteggio client-side degli array.
3. Rimuovere l'endpoint obsoleto `/api/workshops`.

*(Nessuna modifica è stata effettuata ad `attivita.tsx` o `calendar.tsx` in questo protocollo).*
