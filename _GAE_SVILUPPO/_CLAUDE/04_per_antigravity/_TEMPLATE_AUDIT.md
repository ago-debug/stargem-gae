---
tipo: template-prompt
uso: audit/analisi read-only (~3-4h)
note: Cowork copia, modifica le sezioni [TODO:...], elimina questo frontmatter prima di consegnare a Gaetano
---

# Template: AUDIT (read-only)

```
[ID] — [TITOLO BREVE] — ANALISI+PIANO (read-only, ~[STIMA]h).

CONTESTO:
[TODO: 3-5 righe — perché audit, problema scoperto, cross-asse?]

OBIETTIVO: [TODO: 1 riga — cosa produrre come piano]

DELIVERABLE — report markdown in:
_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/[piano|audit]_[ID]_[topic]_2026_05_NN.md

SCOPE ANALISI:

1) [TODO: censimento area 1 — file/endpoint/tabelle da analizzare]
2) [TODO: censimento area 2]
3) [TODO: architettura target proposta]
4) [TODO: migration dati esistenti se applicabile]
5) [TODO: impatto cross-asse F1/F2]
6) [TODO: stima tempi sotto-step]

VINCOLI:
- READ-ONLY codice. ZERO patch.
- Frontmatter Regola 17 (con ora). Wikilink Regola 22.
- Rispetta Regola 13 (tenant_id) se proponi nuove tabelle.
- Linkare cross-asse con [TODO: documenti correlati nel vault].

OUTPUT REPORT (in cima): TL;DR 5-7 righe + 3 decisioni di prodotto/architettura per Gaetano.

Stop & Go a fine: aspetta autorizzazione Fase 2 esecuzione.
```
