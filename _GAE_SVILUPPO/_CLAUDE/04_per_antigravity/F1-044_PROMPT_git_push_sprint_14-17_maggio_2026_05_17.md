---
aggiornato: 2026-05-17T18:00
tipo: prompt-AG-deploy
target: AG-F1 (o AG agnostico)
stima: ~1h
priorita: 🟡 fine sprint
note: prompt F1-044 — git push organizzato sprint 14-17/05 con verifica pre-push completa
---

# F1-044 — Git push sprint 14-17 maggio con verifica pre-push

```
F1-044 — Git commit + push organizzato sprint 14-17/05 (~1h)

CONTESTO:
Sprint molto lungo (14-17 maggio) ha prodotto ~30 task chiusi con modifiche
massicce a BE+FE+schema+migrations. Tutte queste modifiche sono attualmente
non committate o committate parzialmente. Gaetano richiede git push completo,
verificato e organizzato in commit logici.

OBIETTIVO: portare il repository remoto allineato allo stato locale, con
storia git pulita organizzata per tema, dopo aver eseguito tutti i check
pre-push obbligatori per evitare di pushare codice rotto o con credenziali
esposte.

NB: Regola 12 del 00_LEGGIMI consente git commit + git push origin main.
NON deployare in produzione (lo fa Gaetano via Plesk).

═══ PATCH A — Check pre-push obbligatori ═══

A.1 — Verifica stato repo:
   git status (lista modifiche pendenti)
   git log --oneline -20 (ultimi 20 commit per context)
   git branch (branch corrente)

A.2 — Verifica integrità codice:
   npx tsc --noEmit → exit 0 OBBLIGATORIO (R.14)
   npm run build → exit 0 OBBLIGATORIO
   Se uno dei 2 fallisce → STOP, REPORT, non procedere

A.3 — Verifica sicurezza pre-push:
   - grep per credenziali esposte in file da committare:
     password, api_key, secret, token, anthropic_key, BEARER
     (escludere comment, escludere .env)
   - verifica .gitignore include .env, .env.local, *.log, node_modules,
     scripts/backups/, scripts/logs/, scripts/_archive/, uploads/
   - verifica .env.example NON contenga key reali (F1-039 ha già oscurato
     chiave Anthropic, ricontrolla)
   - verifica nessun /uploads/applications/*.pdf o foto privata committato

A.4 — Test smoke endpoint critici:
   curl http://localhost:5001/api/health → 200
   curl http://localhost:5001/api/members | head -c 200 → no error
   curl http://localhost:5001/api/instructors → 200 (post F1-043 fix)
   curl http://localhost:5001/api/calendar-activities → 200

A.5 — Verifica build artifacts:
   dist/ esiste e contiene file recenti
   server bundle correttamente generato

═══ PATCH B — Organizzazione commit logici ═══

B.1 — Raggruppare modifiche per tema in commit separati. Proposta:

   Commit 1 — Schema DB sprint
   Titolo: "schema: cleanup+extension sprint 14-17/05 (F1-026, F1-030, F1-032, F1-040)"
   Files: shared/schema.ts, migrations/F1-026_*.sql, F1-030_*.sql, F1-032_*.sql
   
   Commit 2 — Self-service Tesseramento BE
   Titolo: "feat(tesseramento): self-service BE 3 canali (F1-031)"
   Files: server/routes/membershipApplications.ts, server/services/pdfService.ts,
          server/services/applicationConverter.ts, migrations/F1-031_*.sql
   
   Commit 3 — MC3 Fase B Pagamenti
   Titolo: "feat(pagamenti): MC3 Fase B ricorrenze+rate+voucher+sospensioni (F1-037)"
   Files: server/routes/mc3_pagamenti_fase_b.ts, server/services/paymentCron.ts
   
   Commit 4 — Self-service Tesseramento FE
   Titolo: "feat(tesseramento): self-service FE 3 canali (F2-024, F2-028)"
   Files: client/src/components/tesseramento/*, client/src/pages/tesseramento/*,
          client/src/pages/segreteria/approvazioni.tsx
   
   Commit 5 — MC3 Fase B FE
   Titolo: "feat(pagamenti): MC3 Fase B FE UI ricorrenze+voucher+sospensioni (F2-029)"
   Files: client/src/components/payments/RichiestaSospensioneModal.tsx,
          client/src/components/payments/PaymentSchedulesList.tsx,
          client/src/pages/pagamenti-ricorrenti.tsx,
          client/src/pages/pagamenti-voucher.tsx,
          client/src/pages/segreteria/sospensioni.tsx
   
   Commit 6 — Dashboard + Full-width UX
   Titolo: "ui: home segreteria + full-width R.29 25 pagine (F2-022, F2-023, F2-027)"
   Files: client/src/pages/dashboard.tsx, App.tsx,
          client/src/components/shared/SortableHeader.tsx,
          client/src/hooks/useSortableList.ts,
          client/src/lib/utils/splitFullName.ts
   
   Commit 7 — Import /importa UX + endpoint hardening
   Titolo: "feat(import): UX dropdown A-Z + auto-mapping categorial + extra_data
   header reali (F2-025, F2-026, F1-034, F1-040)"
   Files: client/src/pages/import-data.tsx, server/routes/importChunked.ts
   
   Commit 8 — Performance + cleanup
   Titolo: "perf: photo Base64 → URL relativi + winston rotate + cleanup root
   (F1-039, F1-042)"
   Files: server/middleware/uploadConfig.ts, server/routes.ts (endpoint upload-photo),
          server/logger.ts, .env.example (chiave Anthropic oscurata)

   Commit 9 — Fix /calendario-attivita drift schema
   Titolo: "fix: drift Drizzle ↔ DB su /api/instructors (F1-043)"
   Files: scripts/add_alias_column.ts, _GAE_SVILUPPO faro D_*

B.2 — Per ogni commit:
   - git add files specifici
   - git commit -m "messaggio multilinea con Body"
   - Body include: F-NNN riferimento, sintesi cosa cambia, perché
   - Body include: "Co-authored-by: Antigravity AI" se appropriato

═══ PATCH C — Push ═══

C.1 — git push origin main
   (assumendo branch main; se altro nome → adattare)

C.2 — Verifica post-push:
   git log --oneline origin/main -10 → vedi i nuovi commit lì
   git status → clean

═══ PATCH D — Cleanup post-push ═══

D.1 — Verifica che scripts/_archive/, scripts/backups/, scripts/logs/ siano
   in .gitignore (non committati)
D.2 — Verifica che /uploads/ sia in .gitignore (foto utenti non committate)
D.3 — Verifica nessun file di test/scratch fuori posto

═══ TEST OBBLIGATORI ═══

- npx tsc --noEmit exit 0 (R.14)
- npm run build exit 0
- git status clean post-push
- git log su remote mostra i nuovi commit

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F1-044_git_push_sprint_2026_05_17.md

Contenuto:
1. Stato git pre-intervento (git status output)
2. Check pre-push (lista risultati R.14, build, security grep, smoke endpoint)
3. Lista commit creati (titoli + file inclusi)
4. Output git push (success/error)
5. Verifica post-push (git log remote)
6. Eventuali warning emersi (es. file grossi, branch behind)
7. Side effect rilevati

═══ VINCOLI ═══

- R.12: AG può fare git push, NON deployare in produzione
- R.14: tsc 0 OBBLIGATORIO pre-push
- R.15: F_*_ULTIMI_AGGIORNAMENTI
- R.17: frontmatter ora
- R.22: wikilink vault
- R.28: cleanup scratch già fatto in F1-039
- NO push se npx tsc o npm build falliscono
- NO push se credenziali esposte rilevate
- NO push se uploads/ contiene foto reali
- Commit message in italiano o inglese (consistency con storia esistente)
- Co-author tag opzionale ma raccomandato per tracciabilità
- Branch: main (verificare nome reale, è default)
- Remote: origin (verificare configurato)

Stop & Go a fine. Gaetano controlla GitHub dopo per confermare visibilità.
```
