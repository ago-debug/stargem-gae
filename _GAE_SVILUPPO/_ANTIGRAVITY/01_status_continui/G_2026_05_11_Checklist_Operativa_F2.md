---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md
---

# G — Checklist Operativa Frontend (F2)

| Prio | Task | Descrizione | Stima | Stato |
|---|---|---|---|---|
| **P0** | **Fix 4 errori TypeScript** | Risolvere gli errori bloccanti (Task F2-001) | 1-2h | ✅ FATTO |
| **P1** | **Spacchettamento CRM / Maschera Input** | Introdurre un global state management per il form (es. Zustand) e separare il payload anagrafico. (F2-002 ✅ COMPLETATO: TabAnagrafica migrata) | 2-3w | 🟡 IN CORSO |
| **P2** | **Refactor Calendario (`useTemporalGrid`)** | Smantellare il monolite `calendar.tsx`. Separare la renderizzazione della UI dalla logica matematica/temporale tramite hook headless. Risolvere il bug critico del raggruppamento sul Planning. | 1-2w | 🔴 TO DO |
| **P3** | **State Machine per Checkout Carrello** | Isolare i ricalcoli dei prezzi e creare un sistema di stato robusto per sostituire `PaymentModuleConnector` sul frontend. | 1w | 🔴 TO DO |
