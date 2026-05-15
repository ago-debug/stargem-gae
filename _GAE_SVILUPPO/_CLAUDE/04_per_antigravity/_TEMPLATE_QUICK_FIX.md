---
tipo: template-prompt
uso: quick fix UI/bug (~1-2h)
note: Cowork copia, modifica le sezioni [TODO:...], elimina questo frontmatter prima di consegnare a Gaetano
---

# Template: QUICK FIX

```
[ID] — [TITOLO MOLTO BREVE] (~[STIMA]h)

CONTESTO:
[TODO: 2-3 righe — cosa segnala l'utente, dove (route/file), perché è critico]

OBIETTIVO: [TODO: 1 riga — cosa deve cambiare]

═══ TASK ═══

1) [TODO: step 1 - file + cosa modificare]
2) [TODO: step 2]
3) [TODO: step 3]

═══ TEST OBBLIGATORI ═══

- `npx tsc --noEmit` (Regola 14) — exit 0
- Test funzionale manuale (browser) se UI
- Test curl se API

═══ DELIVERABLE ═══

Report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_[ID]_[topic_snake_case]_2026_05_NN.md

Contenuto:
1. Diff applicato (file:linea, prima/dopo)
2. Risultati test
3. Eventuali side effect/regressioni rilevate

═══ VINCOLI ═══

- Regola 14: tsc 0
- Regola 15: aggiornare F_*_ULTIMI_AGGIORNAMENTI (rinomina timestamp)
- Regola 17: frontmatter con ora
- Regola 22: wikilink solo file vault

Stop & Go a fine.
```
