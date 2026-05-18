---
aggiornato: 2026-05-13T17:00
ultima_verifica_vs_codice: 2026-05-13T17:00
tipo: index-vault
tags: [index, homepage, vault-hub]
---

# 🏠 StarGem Suite — Vault Index

> Homepage del vault Obsidian. Punto di partenza per navigare tutto il progetto.
> Aggiornato a ogni cambio significativo di stato (regola 19 del [[00_LEGGIMI]]).

---

## 📋 Canonici (leggi sempre all'apertura)

- [[00_LEGGIMI]] — 21 regole permanenti del filesystem (AG/Claude)
- [[ISTRUZIONI_COWORK_2026_05_05]] — la "constitution" del modello Cowork
- [[MASTER_STATUS]] — stato globale del progetto post-reset 11/05
- [[ANALISI_MASTER]] — analisi strategica (v5.0 del 25/04, da reverificare)
- [[CHECKLIST_PROGETTO]] — vista d'insieme: cosa è fatto, cosa è in corso, cosa è in coda
- [[INDEX_PROMPT]] — registro progressivo prompt F1-NNN / F2-NNN

---

## 🚦 Prompt operativi pronti / lanciati per Antigravity

- [[00_PROMPT_STATO_DI_FATTO_2026_05_11]] — audit reset stato di fatto (eseguito)
- [[01_PROMPT_FIX_TS_E_AUDIT_ANAGRAFICA_2026_05_11]] — Step A fix TS + Step B audit Anagrafica (eseguiti)
- [[02_PROMPT_RICOSTRUZIONE_FARO_E_PERFORMANCE_2026_05_11]] — Step S faro AG + Step P performance backend (eseguiti)
- [[03_PROMPT_AUDIT_FLUSSO_ISCRIZIONI_2026_05_12]] — 🎯 megaaudit F1-004 + F2-003 (F2-003 lanciato, F1-004 in attesa)

---

## 📊 Audit eseguiti — sintesi e piani

- [[piano_refactor_anagrafica_2026_05_11]] — piano refactor Anagrafica F1+F2 in 6 step (parzialmente eseguito)
- [[strategic_review_sintesi_2026_05_11]] — sintesi convergente strategic review F1+F2
- [[Anagrafica_FixUI_NuoviCampi_2026_05_05]] — 54 campi Athena da esporre in UI
- [[proposal_Quote_Param_2026_05_12]] — proposal Listino Parametrico (priorità #3.5) prodotto da Subagent Ricerca
- [[classificazione_utenti_2026_05_13]] — modello concettuale classificazione utenti (Persona/Società/Pagante/Intestatario) post-dialogo Cowork 13/05 — versione iniziale
- [[classificazione_utenti_2026_05_13bis]] — 🆕 v2 con annotazioni Gaetano: scenari concreti (scuola danza, congregazione), 2 piattaforme welfare reali (Fitprime/Wellhub + Pellegrini/WAI), pagamenti multipli, Gift Card, foglio detrazione fiscale — **fonte autoritativa per MC3**

---

## 📥 Faro di riferimento AG (status_continui)

I file vivi di Antigravity (leggibili anche da Claude per consultazione). Aggiornati ad ogni Stop&Go chiuso (regola 15).

- [[A_2026_05_11_Architettura_Core_Server]] — schema server, route per dominio, middleware
- [[B_2026_05_11_Frontend_Moduli]] — struttura client/src, 5 macro-sezioni UI
- [[C_2026_05_11_Stato_Lavori_e_Briefing]] — sintesi macro-sezioni + priorità
- [[D_2026_05_11_Mappa_Dati_e_Frontend_BACKEND]] — tabella → route → endpoint
- [[D_2026_05_11_Mappa_Dati_e_Frontend_FRONTEND]] — pagina → endpoint API, componente → state
- F_*_ULTIMI_AGGIORNAMENTI — cronaca operativa (file più recente cambia nome ad ogni aggiornamento)
- [[G_2026_05_11_Checklist_Operativa_F1]] — TODO operative backend
- [[G_2026_05_11_Checklist_Operativa_F2]] — TODO operative frontend
- [[H_2026_05_11_Design_System]] — Tailwind tokens, shadcn, pattern UX
- [[I_03_05_26_1605_Fase3_Mappatura_Iscrizioni]] — analisi iscrizioni (storica)
- [[Z_2026_05_11_Performance_File_Pesanti_BACKEND]] — file pesanti backend + proposte ottimizzazione

---

## 📦 Output protocolli AG (audit specifici, datati)

I file di output sono "fotografie datate", non vivi: non vanno aggiornati ma consultati come riferimento storico (regola 16 — sempre richiedono verifica freschezza prima di guidare interventi).

**Audit Anagrafica approfonditi (12/05):**
- [[audit_F1-002_anagrafica_approfondito_2026_05_11]]
- [[audit_F2-002_anagrafica_approfondito_2026_05_11]]

**Megaaudit Flusso Iscrizioni (12/05):**
- [[audit_F1-004_flusso_iscrizioni_backend_2026_05_12]] — ✅ CHIUSO (Aree A-P)
- [[audit_F2-003_flusso_iscrizioni_frontend_2026_05_12]] — ✅ CHIUSO (Aree A-P)

**Validazione formula tessera (13/05):**
- [[report_F1-005_validazione_formula_tessera_2026_05_13]] — 🚨 DIVERGENTE + BUG GRAVE (padding sdoppiato, bug expiry `/api/gempass/tessere`, CF silent merge)

**Macro-Cantiere MC1 — Memory Leak Base64 (13/05):**
- [[piano_F2-004_memory_leak_base64_frontend_2026_05_13]] — piano refactor FE: Multipart FormData + pre-upload asincrono + URL relative

**Report refactor Anagrafica (12/05):**
- [[report_F1-002_anagrafica_letture_join_2026_05_12]] — F1-002 chiuso
- [[report_F2-002_anagrafica_zustand_migration_2026_05_12]] — F2-002 chiuso
- [[report_F1-003_quick_wins_performance_2026_05_12]] — F1-003 in chiusura

**Audit "stato di fatto reale" (11/05):**
- [[stato_di_fatto_F1_backend_2026_05_11]]
- [[stato_di_fatto_F2_frontend_2026_05_11]]

---

## 🎯 RECAP dei moduli — stato a tot

Tutti i RECAP delle 27 chat sono storici (post-reset 11/05) e necessitano riverifica. Lasciati come riferimento.

- [[_TEMPLATE_RECAP]] — modello per nuovi RECAP

---

## 📸 Segnalazioni dal sito live

Cartella `_CLAUDE/05_allegati/_segnalazioni/`. Convenzione `SEG-NNN_<area>_<topic>.png`. Tracciate in [[CHECKLIST_PROGETTO]] sezione Priorità #6.

Aperte attualmente:
- SEG-001 GemStaff PT — contatore record + split cognome/nome
- SEG-002 Anagrafica — rinominare in "Utente" + classificazione (collegato a [[2026_04_20_classificazione_stargem_v2]])
- SEG-003 Pattern globale — ordinamento alfabetico tutte le colonne
- SEG-004 Anagrafica — telefoni malformati (data quality)
- SEG-005 GemTeam — avatar iniziali ordine sbagliato (🔍 da chiarire)
- SEG-006 Utenti/Permessi — account `agro` (🔍 da chiarire)
- SEG-007 GemStaff PT produzione — riferimento (🔍 da chiarire)

---

## 🧭 Sessioni di Analisi (storiche, coordinamento globale)

- [[RECAP_00_ChatAnalisi_2026_04_25]]
- [[RECAP_00_ChatAnalisi_2026_04_27]]
- [[RECAP_00_ChatAnalisi_2026_04_28]] — grande riorganizzazione GAE_SVILUPPO
- [[RECAP_00_ChatAnalisi_2026_05_05_BridgeMCP]]
- [[RECAP_00_ChatAnalisi_2026_05_05_BrowserMode]] — include brief TeoCopilot
- [[RECAP_00_ChatAnalisi_2026_05_05_ModelliAI]]

---

## 📁 Cartelle territoriali

| Path | Descrizione |
|---|---|
| `_CLAUDE/01_canonici/` | MASTER_STATUS, ANALISI_MASTER, ISTRUZIONI_COWORK, CHECKLIST_PROGETTO |
| `_CLAUDE/02_moduli_analisi/` | Analisi tematiche (piani refactor, sintesi convergenti) |
| `_CLAUDE/03_recap_chat/` | RECAP storici delle 27 chat (post-reset) + template |
| `_CLAUDE/04_per_antigravity/` | Prompt, briefing, INDEX_PROMPT per AG |
| `_CLAUDE/05_allegati/` | File utente: Excel, PDF, screenshot. Sottocartella `_segnalazioni/` |
| `_CLAUDE/06_per_cowork/` | Prompt per altre chat Cowork (es. Secondo Cervello) |
| `_ANTIGRAVITY/01_status_continui/` | File faro A→Z aggiornati da AG (lettura per Claude) |
| `_ANTIGRAVITY/02_output_protocolli/` | Report e audit specifici di AG (datati, non vivi) |
| `_ANTIGRAVITY/03_codice_in_lettura/` | Snapshot codice quando Claude lo richiede |
| `_ANTIGRAVITY/04_dati_input/` | CSV/Excel input per AG (es. quote, anagrafiche da importare) |
| `99_archivio/` | Versioni vecchie con timestamp + cartella `2026_05_11_RESET_TOTALE/` |

---

## 🛠️ Quick Actions in Obsidian

| Shortcut | Azione |
|---|---|
| `Cmd+P` | Command Palette (cerca qualunque cosa) |
| `Cmd+O` | Quick switcher (apri file per nome) |
| `Cmd+Shift+F` | Ricerca full-text in tutto il vault |
| `Cmd+Click` su wikilink | Apri in pannello laterale |
| `Cmd+Opt+G` | Vista grafo globale |
| `Cmd+R` | Ricarica vault (dopo Claude/AG hanno aggiornato file) |

---

## 📐 Regole canoniche da memorizzare

| # | Regola | Riferimento |
|---|---|---|
| 13 | `tenant_id` default `'1'` su tutte le nuove tabelle | [[00_LEGGIMI]] §13 |
| 14 | `npx tsc --noEmit` + lint + test in Stop&Go | [[00_LEGGIMI]] §14 |
| 15 | AG aggiorna sempre F_*_ULTIMI_AGGIORNAMENTI + report | [[00_LEGGIMI]] §15 |
| 16 | Validità temporale canonici (decadimento di affidabilità) | [[00_LEGGIMI]] §16 |
| 17 | Timestamp con ORA obbligatorio nel frontmatter | [[00_LEGGIMI]] §17 |
| 18 | Numerazione progressiva prompt F1-NNN / F2-NNN | [[00_LEGGIMI]] §18 |
| 19 | Checklist progetto sempre aggiornata | [[00_LEGGIMI]] §19 |
| 20 | Domande Claude → Gaetano sempre con opzioni multiple | [[00_LEGGIMI]] §20 |
| 21 | F1 SOPRA, F2 SOTTO nei prompt | [[00_LEGGIMI]] §21 |
| 22 | Wikilink Obsidian obbligatori file vivi | [[00_LEGGIMI]] §22 |
| 23 | Verifica allineamento Drizzle ↔ DB post-migration | [[00_LEGGIMI]] §23 |
| 24 | Grep preventivo prima di DROP/RENAME schema | [[00_LEGGIMI]] §24 |
| 25 | Backup DB obbligatorio prima migration distruttive | [[00_LEGGIMI]] §25 |
| 26 | Migration scripts IDEMPOTENTI | [[00_LEGGIMI]] §26 |
| 27 | Sincronizzare schema.ts + storage.ts + routes.ts | [[00_LEGGIMI]] §27 |
| 28 | Cleanup file scratch/test/fix dopo task | [[00_LEGGIMI]] §28 |

---

*Vault homepage aggiornata da Claude (Cowork) — 2026-05-13T17:00*
