---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md
---

# B — Struttura Moduli Frontend (React/Vite)

## 1. Calendario & Planning
- **Pagine:** `calendar.tsx`, `planning.tsx`, `attivita.tsx`
- **Componenti chiave:** `CourseUnifiedModal.tsx`, `CourseDuplicationWizard.tsx`, `CourseSingleDuplicateModal.tsx`
- **shadcn/ui:** `Card`, `Select`, `Dialog`, `Tabs`, `Table`, `Popover`, `Command`

## 2. CRM & Segreteria (Maschera Input Generale)
- **Pagine:** `maschera-input-generale.tsx`, `members.tsx`
- **Componenti chiave:** `crm/TabAnagrafica.tsx` (usa Zustand nativo `useMascheraStore`), `crm/TabIscrizioni.tsx`, `CrmFormContext.tsx` (Thin Wrapper transitorio)
- **shadcn/ui:** `Accordion`, `Input`, `Checkbox`, `Tabs`, `Table`

## 3. Corsi & Attività Didattiche
- **Pagine:** `courses.tsx`, `workshops.tsx`, `iscritti_per_attivita.tsx`, `scheda-attivita.tsx`
- **Componenti chiave:** `activity-management-page.tsx`, `activity-accordion-card.tsx`
- **shadcn/ui:** `Accordion`, `Card`, `Badge`, `Table`

## 4. Contabilità & Pagamenti
- **Pagine:** `payments.tsx`, `accounting-sheet.tsx`, `listini.tsx`
- **Componenti chiave:** `nuovo-pagamento-modal.tsx`, `PaymentModuleConnector.tsx`
- **shadcn/ui:** `Table`, `Select`, `Dialog`

## 5. Utilità Globali & AI
- **Componenti chiave:** `teo-copilot.tsx`, `command-palette.tsx`, `ExportWizard.tsx`
