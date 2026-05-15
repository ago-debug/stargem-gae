---
tipo: template-prompt
uso: refactor/apply patches (~2-3h)
note: Cowork copia, modifica le sezioni [TODO:...], elimina questo frontmatter prima di consegnare a Gaetano
---

# Template: REFACTOR (apply patches)

```
[ID] — [TITOLO BREVE] — Apply patches (~[STIMA]h).

CONTESTO:
[TODO: 3 righe — da quale audit/piano viene, perché ora]

OBIETTIVO: [TODO: 1 riga — cosa deve essere allineato/refactored]

DECISIONI GAETANO (se applicabile):
[TODO: elenca le decisioni di prodotto già acquisite che orientano il refactor]

═══ PATCH [N] — [TITOLO PATCH] ═══

Step N.1 — [TODO: cosa modificare]
Step N.2 — [TODO: file:linea]
Step N.3 — [TODO: validazione]

═══ TEST OBBLIGATORI ═══

- `npx tsc --noEmit` (Regola 14) — exit 0 mandatory
- Test unitari esistenti — tutti verdi
- Test manuale: [TODO: curl/UI/script da eseguire per verifica]

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_[ID]_[topic]_2026_05_NN.md

Contenuto:
1. Diff Patch [N] applicato (file:linea, prima/dopo)
2. Risultati test (tsc + manuale)
3. Eventuali side effect su altri moduli
4. Cose lasciate fuori scope (linkate a task futuri)

═══ VINCOLI ═══

- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI (rinomina timestamp)
- Regola 17: frontmatter con ora
- Regola 22: wikilink solo file vault
- [TODO: vincoli specifici, es. NO modifiche al frontend, NO migration distruttiva]

Stop & Go a fine.
```
