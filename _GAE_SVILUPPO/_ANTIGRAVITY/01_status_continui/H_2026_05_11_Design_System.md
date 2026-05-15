---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md
---

# H — Design System & Pattern UX

## Tailwind Tokens (tailwind.config.ts)
- **Font:** `sans`, `serif`, `mono`
- **Colori custom:** `stargem-red: "#e11d48"`, scala di grigi e variazioni semantic per stati.
- **Token tipografici:** `text-xxs` (10px), `text-xxxs` (8px)
- **Animazioni:** `accordion-down`, `accordion-up`

## Componenti UI Installati (shadcn)
Estensivo uso di primitive unificate per mantenere coerenza visuale:
- `Accordion`, `Card`, `Dialog`, `Select`, `Table`, `Tabs`, `Command`, `Popover`, `Input`, `Checkbox`
- `Badge` (colorati sia via token che tramite esadecimali inline)

## Pattern UX Consolidati
1. **Pennini A/B (`inline-list-editor`):** Utilizzati per l'editing rapido direttamente nelle righe di lista. Offrono un flow continuativo senza interruzioni modali. Altamente apprezzati.
2. **ExportWizard:** Pattern standardizzato cross-module che uniforma l'esportazione dati (CSV/Excel/PDF) per qualsiasi griglia/tabella del gestionale.
3. **Scheda-Corso / Activity Management:** Pattern di layout unificato per la visualizzazione delle entità, progettato per ridurre il debito tecnico visivo e le deviazioni nell'UI. Attualmente implementato con successo in `iscritti_per_attivita.tsx` e `courses.tsx`.
4. **Assistente Globale (Command Palette / Teo Copilot):** Layer flottante richiamabile ovunque, isolato dal normale flow di interazione e senza impatto sul layout DOM.
