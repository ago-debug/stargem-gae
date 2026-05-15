---
tags: [antigravity, strategic-review, audit, parere-tecnico]
aggiornato: 2026-05-11
tipo: prompt-strategico
---

# 📊 Strategic Review di Antigravity — 2026_05_11

> Collegati: [[00_INDEX]] · [[MASTER_STATUS]] · [[00_BRIEFING_RIPRESA_2026_05_05]]

## Contesto

Gaetano vuole un **parere tecnico onesto** di AG prima di ripartire con l'esecuzione. AG ha 3 mesi di contesto diretto sul codice, conosce dove sono i nodi. Questa è una pausa riflessiva, non operativa.

Due prompt separati — uno per ogni finestra — per parallelizzare il lavoro e ottenere due prospettive distinte (backend/F1 e frontend/F2) sullo stesso progetto.

Output: due documenti distinti in `_ANTIGRAVITY/02_output_protocolli/`. Claude (Cowork) li leggerà e li convergerà in un documento di sintesi.

---

## 🅰️ PROMPT F1 — Strategic Review BACKEND

Copia-incolla nella finestra AG-F1 (Backend):

```
PER AG-F1 (BACKEND) — STRATEGIC REVIEW (richiesta di parere)

PRIMA AZIONE OBBLIGATORIA: leggi nell'ordine
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md
4. _GAE_SVILUPPO/_CLAUDE/04_per_antigravity/00_BRIEFING_RIPRESA_2026_05_05.md
5. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_04_05_26_0315_ULTIMI_AGGIORNAMENTI.md
6. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/E_Segnalazioni_DB.md
7. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/A_02_05_26_1130_Architettura_Core_Server.md
8. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_04_05_26_0315_Mappa_Dati_e_Frontend.md
9. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/Z_02_05_26_1130_Architettura_Pruned.md
10. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/Z_02_05_26_1130_REPORT_CLEANUP_DB.md

CONTESTO E RICHIESTA SPECIALE
Sei il senior backend engineer che ha implementato StarGem da febbraio 2026. Hai più contesto diretto sul DB e sul server di chiunque altro nel team. Gaetano sta per riprendere a lavorare in modo strutturato dopo una pausa di riorganizzazione, e prima di dirti cosa fare voglio chiederti il TUO parere onesto.

NIENTE risposte diplomatiche o "in linea". Voglio l'opinione vera di chi ha messo le mani sul codice per 3 mesi. Cita nomi di file/route/tabelle quando puoi. Niente generalismi.

DOMANDE A CUI RISPONDERE (una per una, riflessivo)

## 1. Sintesi onesta dello stato — lato backend
In 5-10 righe: com'è davvero il backend di StarGem oggi? Quanto è solido vs quanto è fragile? Routes che hai paura di toccare? Query che vanno bene per ora ma esploderanno con 10× i dati? Tu hai paura di qualcosa quando deployi?

## 2. Debito tecnico — i 3 problemi backend più seri
Tre zone del codice server/DB che oggi ti preoccupano di più (fragilità, complessità, rischio regressione). Per ognuna:
- File o route specifici
- Perché ti preoccupa
- Cosa potrebbe rompersi
- Stima sforzo per risolvere

## 3. Decisioni backend che, col senno di poi, riprenderei
- STI in courses è andato come pensavamo o ha problemi di performance/manutenibilità?
- Drizzle ORM è la scelta giusta o avresti preferito Prisma / SQL puro?
- payments / PaymentModuleConnector con 14 route accoppiate — design ok o da rifare?
- universal_enrollments droppata vs enrollments unica — confermi che la decisione era giusta?

## 4. La domanda secca di Gaetano sulla tabella members
Gaetano vuole sapere perché tessere (colonne O-U di members) e certificati medici (colonne V-W) sono dentro members invece che in `memberships` e `medical_certificates`. Risposta tua, senza zigzag:
- È un errore architetturale storico da bonificare?
- È una scelta consapevole (denormalizzazione per performance)?
- Cosa raccomandi: lasciare, droppare, migrare?
- Quali rischi nel migrare ora (FK in entrata, route che leggono quelle colonne, ecc.)?

## 5. Le prossime 6-8 settimane — come le imposteresti TU lato backend
Se TU fossi engineering lead del backend, cosa metteresti come priorità nelle prossime 6-8 settimane? Considera:
- Re-import members/memberships/payments in arrivo (Gaetano sta organizzando i dati)
- PRIORITA 1b in MASTER_STATUS (Fix UI campi nascosti — anche routes API da espandere)
- routes.ts (12k righe) — smantellamento sospeso 02/05 per dipendenze incrociate, da riprendere o rimandare?
- L'integrazione AI enterprise di 01/05 — c'è da consolidare?
Cosa rimanderesti? Quali sono i task che non vale la pena fare adesso?

## 6. SaaS multi-tenant a 2 anni — blocchi backend
Guardando il codice attuale, quanto siamo lontani da un SaaS multi-tenant?
- Schema DB: c'è un piano per tenant_id su tutte le tabelle? Quali tabelle sono PIÙ difficili da multi-tenantizzare?
- Isolamento dati: come pensi di garantirlo (RLS, query-level, schema-per-tenant)?
- Performance: il DB oggi regge 1 cliente, regge 50? 500?
- Migrations: come pensi di gestirle multi-tenant?
- Qualcosa di urgente da iniziare ORA per non pagarlo pesante dopo (es. tenant_id come campo "futuro" in tabelle nuove)?

## 7. Multi-tool: Cowork come regia + tu come esecutore + Claude Code Agent Teams in parallelo
Dimmi cosa pensi del nuovo modello:
- Funziona la separazione "Claude descrive COSA, AG decide COME"?
- Cosa cambieresti nel flow attuale?
- Vedi rischi nell'aggiungere Claude Code Agent Teams in parallelo a te (es. conflitti git, ambiguità responsabilità)?

## 8. Cleanup file in _ANTIGRAVITY/ (lato backend)
Apri _ANTIGRAVITY/01_status_continui/ e 02_output_protocolli/. Quali file BACKEND-SIDE sono OBSOLETI (riferiscono a stati superati o protocolli chiusi)? Proponi un elenco preciso di file da archiviare in 99_archivio/, con motivazione per ognuno. Considera in particolare:
- A_*, C_*, D_*, E_*, F_*, G_*, Y_*, Z_* dei status_continui
- audit, screening, report F1-* in 02_output_protocolli

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/strategic_review_F1_backend_2026_05_11.md

Struttura: una sezione per ogni domanda. Prosa, schietto, specifico. Niente filler. Niente "lo farò se mi confermi". Rispondi davvero, fai l'analisi vera.

STOP & GO: dopo aver scritto il documento, fermati e aspettami. Zero modifiche al codice in questa sessione. Solo riflessione + scrittura.
```

---

## 🅱️ PROMPT F2 — Strategic Review FRONTEND

Copia-incolla nella finestra AG-F2 (Frontend):

```
PER AG-F2 (FRONTEND) — STRATEGIC REVIEW (richiesta di parere)

PRIMA AZIONE OBBLIGATORIA: leggi nell'ordine
1. _GAE_SVILUPPO/00_LEGGIMI.md
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
3. _GAE_SVILUPPO/_CLAUDE/01_canonici/ANALISI_MASTER.md
4. _GAE_SVILUPPO/_CLAUDE/04_per_antigravity/00_BRIEFING_RIPRESA_2026_05_05.md
5. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/F_04_05_26_0315_ULTIMI_AGGIORNAMENTI.md
6. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/B_02_05_26_1130_Frontend_Moduli.md
7. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_04_05_26_0315_Mappa_Dati_e_Frontend.md
8. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/H_02_05_26_1728_Design_System.md
9. _GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/I_03_05_26_1605_Fase3_Mappatura_Iscrizioni.md

CONTESTO E RICHIESTA SPECIALE
Sei il senior frontend engineer che ha implementato StarGem da febbraio 2026. Hai più contesto diretto sui componenti React e sull'UX di chiunque altro nel team. Gaetano sta per riprendere a lavorare in modo strutturato dopo una pausa di riorganizzazione, e prima di dirti cosa fare voglio chiederti il TUO parere onesto.

NIENTE risposte diplomatiche o "in linea". Voglio l'opinione vera di chi ha messo le mani sui componenti per 3 mesi. Cita nomi di file/componenti/pagine quando puoi. Niente generalismi.

DOMANDE A CUI RISPONDERE (una per una, riflessivo)

## 1. Sintesi onesta dello stato — lato frontend
In 5-10 righe: com'è davvero il frontend di StarGem oggi? Quanto è solido vs quanto è fragile? Componenti che hai paura di toccare? Pagine che vanno bene "per ora" ma sono già al limite? Pattern UX coerenti o ognuna pagina è diversa? Tu hai paura di qualcosa quando deployi?

## 2. Debito tecnico — i 3 problemi frontend più seri
Tre zone del codice client che oggi ti preoccupano di più (fragilità, complessità, rischio regressione). Per ognuna:
- File o componente specifico
- Perché ti preoccupa
- Cosa potrebbe rompersi
- Stima sforzo per risolvere

Considera in particolare:
- maschera-input-generale.tsx (4.5k righe) — smantellamento sospeso 02/05
- calendar.tsx (3.500 righe) — refactor pendente
- CourseUnifiedModal.tsx — vista pivot Registro di Classe appena aggiunta
- I 5 pattern scheda-* (corso, allenamento, domeniche, lezione individuale, campus) — sono davvero unificati o si stanno divergendo?

## 3. Decisioni frontend che, col senno di poi, riprenderei
- React Query è la scelta giusta o avresti preferito SWR / TanStack Query nativo?
- Tailwind + shadcn è andato come pensavi o ha problemi di mantenibilità?
- Routing: è coerente, navigabile, breadcrumb-friendly?
- ExportWizard unificato su 10 sezioni — design ok?
- I "Pennini A/B" (InlineListEditor) come standard globale — confermi?

## 4. La maschera-input-generale e routes.ts come "monolite frontend"
- Cosa rende davvero pericoloso smantellare maschera-input-generale.tsx? Quali sono i punti di ramificazione critici?
- Quanto è grave il coupling tra routes.ts frontend (se c'è) e le pagine? La proposta era spacchettare modulo-per-modulo con supervisione manuale — confermi che è l'unica via sicura?

## 5. Le prossime 6-8 settimane — come le imposteresti TU lato frontend
Se TU fossi engineering lead del frontend, cosa metteresti come priorità nelle prossime 6-8 settimane? Considera:
- PRIORITA 1b in MASTER_STATUS (Fix UI campi nascosti — 54+ campi Athena in anagrafica, 10 campi pagamenti, 4 campi tessera)
- 12_Gemdario UI FREEZE — quando si può togliere?
- Tab "Incolla Testo" in /importa (StopAndGo del 05/05 in attesa)
- Refactor calendar.tsx (3.500 righe, sessione dedicata necessaria)
Cosa rimanderesti? Quali sono i task che non vale la pena fare adesso?

## 6. SaaS multi-tenant a 2 anni — blocchi frontend
Guardando il codice attuale, quanto siamo lontani da un SaaS multi-tenant lato UI?
- White-label: come potremmo tematizzare per cliente (logo, colori, intestazioni)? Tailwind theme dinamico è realistico?
- Permessi: la matrice ruoli x sezioni (5 ruoli × 30 sezioni) regge multi-tenant o serve un nuovo livello (tenant.permission)?
- Multi-lingua: è pensata? Se no, quanto costa aggiungerla dopo?
- Onboarding clienti nuovi: c'è uno scaffolding o sarà una migrazione manuale per ogni nuovo cliente?
- Qualcosa di urgente da iniziare ORA per non pagarlo pesante dopo?

## 7. Multi-tool: Cowork come regia + tu come esecutore + Claude Code Agent Teams in parallelo
Dimmi cosa pensi del nuovo modello:
- Funziona la separazione "Claude descrive COSA, AG decide COME"?
- Cosa cambieresti nel flow attuale?
- Vedi rischi nell'aggiungere Claude Code Agent Teams in parallelo a te (es. conflitti git, ambiguità responsabilità sui componenti)?

## 8. Cleanup file in _ANTIGRAVITY/ (lato frontend)
Apri _ANTIGRAVITY/01_status_continui/ e 02_output_protocolli/. Quali file FRONTEND-SIDE sono OBSOLETI (riferiscono a stati superati o protocolli chiusi)? Proponi un elenco preciso di file da archiviare in 99_archivio/, con motivazione per ognuno. Considera in particolare:
- B_*, H_*, I_* dei status_continui
- report F2-* in 02_output_protocolli (parecchi sono di 28-29 aprile, probabilmente chiusi)

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/strategic_review_F2_frontend_2026_05_11.md

Struttura: una sezione per ogni domanda. Prosa, schietto, specifico. Niente filler. Niente "lo farò se mi confermi". Rispondi davvero, fai l'analisi vera.

STOP & GO: dopo aver scritto il documento, fermati e aspettami. Zero modifiche al codice in questa sessione. Solo riflessione + scrittura.
```

---

## Note di coordinamento

Le due review non si parlano. Quando Gaetano avrà entrambi i documenti, Claude (Cowork) li leggerà, identificherà:

- **Convergenze**: dove F1 e F2 dicono la stessa cosa → certezze
- **Divergenze**: dove dicono cose diverse → punti che richiedono decisione
- **Sovrapposizioni**: stesso problema visto da angoli diversi → priorità trasversali

Output finale di Claude: `_CLAUDE/02_moduli_analisi/strategic_review_sintesi_2026_05_11.md`.

Da quel documento + l'audit `_CLAUDE/` che Claude farà in parallelo → il piano di cleanup e ridefinizione priorità.

---

*Prompt creati da Claude (Cowork) — 2026_05_11*
