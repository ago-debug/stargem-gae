---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
fonti_verificate:
  - _ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md
---

# D — Mappa Dati e Stato Frontend

## 1. Calendario & Planning
- **Endpoint API:** `GET /api/courses`, `GET /api/config/center-hours`, `POST /api/attendances/bulk`
- **State & Hooks:** Presentation logic mista a data fetching in `calendar.tsx`. Ricalcoli pesanti sulle griglie temporali tramite `ResizeObserver`.

## 2. CRM & Segreteria
- **Endpoint API:** `GET|POST|PATCH /api/members`, `GET /api/memberships`, `GET /api/medical-certificates`
- **State & Hooks:** Global state estremamente complesso e fragile veicolato tramite `CrmFormContext`. Problemi di typing identificati su `setVerificaStato`.

## 3. Corsi & Attività
- **Endpoint API:** Route STI unificate per `courses` e sotto-entità.
- **State & Hooks:** Componentizzazione pulita in `activity-management-page.tsx`.

## 4. Contabilità & Pagamenti
- **Endpoint API:** `GET /api/payments`, `GET /api/course-quotes-grid`, `POST /api/checkout`
- **State & Hooks:** Assenza di un vero State Machine manager per il carrello. Presenza di pericolosi ricalcoli locali del prezzo (`useCheckoutCalculator`, `usePriceFromMatrix`) distaccati dal backend in `PaymentModuleConnector`.

## 5. Utilità & AI
- **Endpoint API:** API verso Vercel AI SDK per LLM (gpt-4o-mini).
- **State & Hooks:** `useCopilot`, componenti isolati con proprio stato locale disaccoppiato.
