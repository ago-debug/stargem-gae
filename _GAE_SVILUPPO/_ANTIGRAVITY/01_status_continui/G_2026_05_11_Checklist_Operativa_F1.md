---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
validita_prevista: 2026-05-25
fonti_verificate:
  - "[[stato_di_fatto_F1_backend_2026_05_11]]"
---

# G — Checklist Operativa F1
**Documento Faro — Backend**

Lista delle azioni pratiche a carico del backend (F1), stimate e ordinate per urgenza operativa.

## PRIORITÀ ALTA (Bloccanti per Sviluppo e Test)
- [ ] **Popolare il DB dev locale per i test (Reimport)**
  - *Perché*: L'azzeramento di tabelle core (`enrollments`, `team_scheduled_shifts`, `payments`) rende impossibile la validazione visiva della UI e dei flussi.
  - *Stima*: 2 ore.
- [ ] **Risolvere i 4 Errori TypeScript nel Frontend**
  - *Perché*: Attualmente `npx tsc --noEmit` fallisce su `TabAnagrafica`, `TabGift` e `maschera-input-generale`. Blocca la validazione formale Regola 14 in chiusura task.
  - *Stima*: 1 ora.
- [ ] **Disaccoppiamento `members` da Tessere/Certificati (Fase API)**
  - *Perché*: È la prima fase della Priorità 1 (Anagrafica).
  - *Azione*: Riscrivere le route API che estraggono i `members` includendo `LEFT JOIN` su `memberships` e `medical_certificates`, preparando la UI a non leggere più le colonne piatte di `members`.
  - *Stima*: 1-2 giorni.

## PRIORITÀ MEDIA (Debito Tecnico)
- [ ] **Sbrogliare i TODO Legacy in `routes.ts`**
  - *Perché*: Il monolite è inquinato da `// TODO: route categorie legacy` e `@ts-ignore // TODO: STI-cleanup` (circa 40 occorrenze).
  - *Azione*: Pulizia chirurgica del dead code e refactoring delle chiamate TypeScript per migliorare la type-safety.
  - *Stima*: 1 giorno.
- [ ] **Estrazione Payment Service**
  - *Perché*: Disaccoppiare il controller di pagamento dalla UI e da `routes.ts`.
  - *Azione*: Creare `server/services/PaymentService.ts` centralizzando calcoli sconti, listino e validazioni transazionali.
  - *Stima*: 3-5 giorni.

## PRIORITÀ BASSA (Miglioramenti)
- [ ] **Smantellamento completo di `routes.ts`**
  - *Perché*: Alleviare il carico del file principale dividendolo per dominio logico (`routes/courses.ts`, `routes/auth.ts`, ecc.).
  - *Stima*: 1-2 settimane di lavoro incrementale.
