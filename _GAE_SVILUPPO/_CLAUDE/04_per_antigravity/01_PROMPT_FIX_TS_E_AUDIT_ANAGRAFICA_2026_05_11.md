---
tags: [antigravity, fix-ts, audit, anagrafica]
aggiornato: 2026-05-11
tipo: prompt-operativo
---

# Prompt operativi 2026-05-11 — Step A (fix TS) + Step B (audit Anagrafica)

> Collegati: [[MASTER_STATUS]] · [[ISTRUZIONI_COWORK_2026_05_05]] · `00_LEGGIMI.md` (regola 15 tracciabilità)

---

## 🚨 STEP A — Fix 4 errori TypeScript bloccanti (AG-F2)

Incolla in **AG-F2**:

```
PER AG-F2 (FRONTEND) — FIX 4 ERRORI TYPESCRIPT BLOCCANTI (Priorità #0)

PRIMA AZIONE OBBLIGATORIA: leggi nell'ordine
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso articolo 15 nuova regola tracciabilità)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione "4 errori TypeScript bloccanti")
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md (tuo audit di stamattina)

OBIETTIVO: portare `npx tsc --noEmit` a ZERO errori. Sono 4 errori concentrati nel comparto CRM, tutti documentati negli audit di stamattina.

ERRORI DA RISOLVERE
1. client/src/components/crm/TabAnagrafica.tsx:167
   - Errore: usato "phone" invece di "telefono" (campo non esiste con quel nome nello schema)
   - Fix atteso: allineare la stringa al nome reale del campo nello schema

2. client/src/components/crm/TabGift.tsx:47
   - Errore: Parameter 'prev' implicitly has an 'any' type
   - Fix atteso: tipizzazione esplicita del callback di useState

3. client/src/components/crm/TabGift.tsx:51
   - Errore: stesso problema di tipizzazione implicita
   - Fix atteso: stesso pattern di sopra

4. client/src/pages/maschera-input-generale.tsx:2005
   - Errore: Type mismatch sul Dispatch/SetState di setVerificaStato (interfaccia Record vs Oggetto tipizzato in CrmFormContext)
   - Fix atteso: allineare il type del setter nel context con quello del consumer. Verifica entrambe le firme prima di scegliere quale adattare.

METODO
- Prima di scrivere codice: leggi i 4 file coinvolti per intero, capisci il context.
- Mostra a Gaetano il fix proposto per OGNI errore (4 mini-blocchi di diff) PRIMA di applicare.
- Aspetta OK esplicito per ogni fix (può essere OK cumulativo se i 4 sono ortogonali).
- Solo dopo OK: applica le modifiche.

VALIDAZIONE (Regola 14 OBBLIGATORIA)
- npx tsc --noEmit → DEVE finire con 0 errori
- npm run lint → 0 errori
- Se uno dei due fallisce: FERMA, riporta errore, NON chiudere protocollo

TRACCIABILITÀ (Regola 15 NUOVA OBBLIGATORIA)
A fine sessione DEVI produrre:
1. Aggiornamento di _ANTIGRAVITY/01_status_continui/F_<timestamp_corrente>_ULTIMI_AGGIORNAMENTI.md (crea il file con la convenzione naming corrente, archivia eventuale F_ precedente in 99_archivio/ con timestamp)
2. Report completo in _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/report_F2-001_fix_4_errori_ts_2026_05_11.md
   - Cosa hai trovato in ogni file
   - Diff applicato (con linee prima/dopo)
   - Esito validazione tsc + lint
   - Eventuali side-effects o componenti correlati toccati di rimando

STOP & GO
- Mostra diff prima di applicare
- Aspetta OK Gaetano
- Validazione DOPO ogni fix singolo o cumulativa (a tua scelta)
```

---

## 🔬 STEP B — Audit approfondito Anagrafica & CRM (AG-F1 + AG-F2 in parallelo)

Da lanciare **DOPO** che lo Step A è chiuso e tsc passa a 0 errori. Audit read-only profondo, prepara il piano di refactor di Anagrafica.

### B.1 Incolla in AG-F1 (Backend Anagrafica)

```
PER AG-F1 (BACKEND) — AUDIT APPROFONDITO SEZIONE ANAGRAFICA

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso articolo 15 tracciabilità)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione 3.1 Anagrafica & CRM)
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F1_backend_2026_05_11.md (tuo audit § 3 Anagrafica & CRM)

OBIETTIVO: mappare con precisione chirurgica la sezione Anagrafica lato backend per preparare il piano di refactor.

DOMANDE A CUI RISPONDERE
1. Schema tabella `members` (170+ colonne): elenco ESATTO delle colonne raggruppate per famiglia (anagrafica base, contatti, residenza, tutori, consensi, azienda, documenti, bancari, misure, emergenza, education, athena, professionale, tessere [O-U], certificati [V-W], colonna A id legacy, colonna BA id legacy). Per ogni famiglia: quante colonne, esempi, tipo.

2. FK in entrata verso `members.id`: quali tabelle fanno foreign key a `members`? (es. enrollments.member_id, payments.member_id, memberships.member_id, medical_certificates.member_id, team_employees.member_id, ecc.). Lista completa con `onDelete` policy.

3. Route API che leggono colonne tessere/certificati DA members (non dalle tabelle dedicate): esempi tipici sono `members.hasMedicalCertificate`, `members.cardNumber`. Grep ESATTO sul codice + lista delle route + file/linea. Questo è il dato critico per pianificare il refactor JOIN.

4. Route API che usano correttamente `memberships` e `medical_certificates`: confronto col punto 3. Quali sono già "puliti"?

5. Tabella `memberships`: schema completo, vincoli (member_id + season_id unique), seasons (ID 1=25/26, 2=26/27, 3=24/25), eventuali storico.

6. Tabella `medical_certificates`: schema completo, vincoli, relazione con `members`.

7. Smart Routing import attuale: come funziona oggi `QUOTATESSERA → memberships`, `DTYURI/DTNELLA → medical_certificates`? File + logica.

8. Migrazioni che hanno toccato `members` negli ultimi 60 giorni: lista ordinata cronologicamente, con descrizione.

9. Domande aperte di Gaetano (DB Monitor 04/05) — verificale di nuovo nello stato attuale:
   - Colonne O-U in `members`: confermi che sono tessere?
   - Colonne V-W: confermi che sono certificati?
   - Colonna A: dato id legacy?
   - Colonna BA: confermi droppabile?

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F1-002_anagrafica_approfondito_2026_05_11.md

Struttura suggerita:
## A. Schema completo `members` per famiglie
## B. FK in entrata su `members.id`
## C. Route che leggono tessere/certificati DA members (debito da bonificare)
## D. Route che usano già correttamente `memberships`/`medical_certificates`
## E. Schema `memberships`
## F. Schema `medical_certificates`
## G. Smart Routing import attuale
## H. Migrazioni recenti su `members`
## I. Risposte aggiornate alle 4 domande di Gaetano
## SINTESI E PROPOSTA DI PIANO REFACTOR
- Sequenza esatta dei passi (route per route, file per file)
- Stima sforzo in ore per ogni passo
- Rischi per ogni passo

REGOLE
- READ-ONLY. Nessuna modifica al DB, nessuna modifica al codice.
- Validazione regola 14: npx tsc --noEmit comunque a fine (deve essere 0 dopo Step A chiuso)
- Tracciabilità regola 15: aggiorna F_<timestamp>_ULTIMI_AGGIORNAMENTI.md con nota di chiusura task

STOP & GO: zero modifiche. Solo lettura + scrittura del documento.
```

### B.2 Incolla in AG-F2 (Frontend Anagrafica)

```
PER AG-F2 (FRONTEND) — AUDIT APPROFONDITO SEZIONE ANAGRAFICA UI

PRIMA AZIONE OBBLIGATORIA: leggi
1. _GAE_SVILUPPO/00_LEGGIMI.md (incluso articolo 15 tracciabilità)
2. _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md (sezione 3.1 Anagrafica & CRM)
3. _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/stato_di_fatto_F2_frontend_2026_05_11.md (tuo audit § 2 CRM)

OBIETTIVO: mappare il monolite frontend dell'Anagrafica (maschera-input-generale.tsx + crm/ + members.tsx) per preparare il piano di spacchettamento.

DOMANDE A CUI RISPONDERE
1. Mappa di maschera-input-generale.tsx (4.500 righe): dividere in BLOCCHI LOGICI. Per ogni blocco: range righe, scopo, dipendenze esterne, stato che gestisce, hook usati.

2. CrmFormContext: schema completo dello state condiviso. Punti di consumo (file/componenti) e cosa modificano. Flusso dal Provider al consumer.

3. Tab esistenti (Anagrafica, Iscrizioni, Gift, altri): per ognuna file, scopo, validazione Zod, criticità note.

4. State machine effettiva del wizard multi-step: come si passa da una tab all'altra? Validazioni che bloccano? Cosa succede al "Salva"? Payload di salvataggio "mostruoso" (parole tue stamattina) — esattamente cos'è e quanto è grande.

5. members.tsx (pagina lista): come si rapporta a maschera-input? Quali campi mostra in tabella? Da dove vengono?

6. anagrafica-home.tsx o equivalenti: altre pagine UI che leggono members? Lista.

7. Componenti shadcn/ui critici nel flusso: Accordion, Sheet, Tabs, Dialog, ecc. Punti di rottura potenziale.

8. 54 campi Athena nascosti: dove vengono caricati dal backend (route)? Sono già nel tipo TS frontend ma non renderizzati? O non sono in fetch?

9. Pattern di salvataggio: oggi è single big payload o auto-save per pezzi? La tua proposta di stamattina (auto-save per tab con Zustand) — quanto realistica come refactor incrementale vs big-bang?

OUTPUT
File: _GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/audit_F2-002_anagrafica_approfondito_2026_05_11.md

Struttura suggerita:
## A. Mappa a blocchi di maschera-input-generale.tsx
## B. CrmFormContext — schema state + punti di consumo
## C. Tab e validazioni
## D. State machine wizard + payload di salvataggio
## E. members.tsx e altre pagine UI lettrici di members
## F. 54 campi Athena nascosti — dove sono nel codice
## G. Componenti shadcn critici e pattern di rottura
## H. Pattern di salvataggio attuale + proposta auto-save Zustand
## SINTESI E PROPOSTA DI PIANO SPACCHETTAMENTO INCREMENTALE
- Sequenza esatta (es. estrai prima componente X, poi Y, poi Z)
- Stima sforzo per fase
- Rischi e mitigazioni

REGOLE
- READ-ONLY. Nessuna modifica al codice.
- Validazione regola 14: npx tsc --noEmit deve essere 0 a fine (Step A già completato).
- Tracciabilità regola 15: aggiorna F_<timestamp>_ULTIMI_AGGIORNAMENTI con nota di chiusura task.

STOP & GO: zero modifiche. Solo lettura + scrittura documento.
```

---

## Cosa farò io (Claude/Cowork) dopo

1. Quando Step A è chiuso (tsc a 0) → ti dico OK procediamo con B
2. Quando entrambi i documenti di Step B sono pronti → leggo, faccio sintesi convergente F1+F2 in un documento `_CLAUDE/02_moduli_analisi/piano_refactor_anagrafica_2026_05_11.md`
3. Su quel piano, identifichiamo i primi micro-task atomici per cominciare il refactor sicuro
4. Dopo Anagrafica → ripetiamo lo schema per Pagamenti, poi Calendario

---

*Prompt creati da Claude (Cowork) — 2026_05_11*
