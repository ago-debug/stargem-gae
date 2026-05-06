# RECAP_23_KnowledgeBase

> **Stato chat:** 🔴 Da iniziare — nessun protocollo ancora emesso
> **Data ultima sessione:** 05/05/2026
> **Sessioni totali:** 1 (apertura)
> **Ultimo aggiornamento:** 05/05/2026

---

## 1. IDENTITÀ DELLA CHAT

| Campo | Valore |
|---|---|
| Numero chat | 23 |
| Nome modulo | Knowledge Base |
| Rotta UI | `/knowledge-base` |
| Componente React | `KnowledgeBase` |
| Tabella DB principale | `knowledge` |
| Stato architetturale | canonico — 6 tab completi (ma embrionale come contenuto) |
| Sidebar UI | Blocco "Risorse Umane & Team" |
| Origine | Phase 28.5 — 04/04/2026 (Security by Design) |

---

## 2. SCOPO DEL MODULO

Il modulo Knowledge Base è l'**hub di documentazione interna** del gestionale StarGem. Nasce in Phase 28.5 con un solo articolo (la Matrix dei 5 Ruoli) e ha potenziale per diventare il punto di accesso a tutta la documentazione operativa, normativa e tecnica del centro.

La tabella `knowledge` è oggi descritta in `01_Architettura_Core_Server.md` come *"tooltip di aiuto e spiegazioni visibili nelle sezioni dell'interfaccia"*. È quindi una tabella **multi-uso**: serve sia per articoli wiki visibili a `/knowledge-base`, sia potenzialmente per tooltip contestuali UI.

---

## 3. STATO ATTUALE — COSA C'È GIÀ

### Backend
- Tabella `knowledge` esistente nel DB (campi non ancora ispezionati in questa chat — F1-001 non ancora emesso)
- Nessuna route `/api/knowledge*` verificata (audit pendente)

### Frontend
- Componente `KnowledgeBase` attivo e raggiungibile da sidebar
- Voce sidebar collocata nel blocco "Risorse Umane & Team" insieme a Staff/Insegnanti, Inserisci Nota, Commenti Team, ToDo List
- UN solo articolo pubblicato: **Matrix Interattiva dei 5 Ruoli e Permessi** ("Chi Vede Cosa")
- Origine artifact: `report_accessi_e_ruoli.md` generato in Phase 28.5

### Integrazione con altri moduli
- Collegamento logico con `/utenti-permessi` (i 5 ruoli ufficiali sono la base della Matrix)
- Tooltip admin gestiti tramite tabella `knowledge` da `/admin` (Pannello Admin Globale)

---

## 4. SCENARI PROPOSTI A GAETANO (in attesa di scelta)

### Scenario A — Wiki aziendale completo (scope largo)
- CRUD articoli con editor Markdown + allegati
- Categorie: Operatività, Sicurezza, HR, Contabilità, Tecnico, Regolamenti
- Permessi lettura/scrittura per ruolo (riusa i 5 ruoli ufficiali già definiti)
- Ricerca full-text
- Seeding iniziale dai file nel Project Knowledge:
  - `Codice_Disciplinare_Aziendale_TEAM_e_STAFF_SG.md` → categoria HR
  - `Regolamento_aziendale_interno_per_TEAM_e_STAFF_SG.md` → categoria HR
  - `utenti_Domanda_Tesseramentoset2025.pdf` (regolamento iscritti) → categoria Segreteria
  - Matrix Ruoli (già presente)

### Scenario B — Help System contestuale (scope tecnico)
- Estende l'uso attuale della tabella `knowledge` per tooltip UI ovunque
- Ogni campo / sezione della UI ha un `knowledge_key` associato
- Hover o icona `?` → mostra definizione
- Admin gestisce i tooltip da `/admin`
- Nessun vero "articolo" visibile, solo micro-documentazione inline

### Scenario C — Ibrido (consigliato da Claude)
- Struttura a 2 livelli:
  - **Articoli** lato pubblico team (UI `/knowledge-base`)
  - **Tooltip** lato contestuale inline sui campi (stessa tabella o tabella sorella)
- Seeding con i regolamenti + Matrix Ruoli
- Roadmap per onboarding nuovi operatori

---

## 5. DECISIONI ARCHITETTURALI APERTE

Prima di emettere F1-001 servono 4 risposte da Gaetano:

1. **Scope:** A / B / C?
2. **Regolamenti iscritti:** il Regolamento Interno (PDF firmato) deve finire in KB come articolo leggibile o resta solo PDF scaricabile?
3. **Editor contenuti:** Markdown puro (tipo Notion lite) oppure WYSIWYG (tipo CKEditor)?
4. **Versioning articoli:** serve storico modifiche (tipo Wikipedia) o basta "ultima versione + updated_at"?

---

## 6. PIANO PROTOCOLLI PROPOSTO (se approvato Scenario C)

```
F1-001  READ-ONLY · audit tabella knowledge
        - DESCRIBE knowledge
        - COUNT(*) e SELECT sample (LIMIT 10)
        - grep routes /api/knowledge*
        - lettura componente KnowledgeBase.tsx
        Output: report di stato — nessuna modifica

F2-001  audit UI attuale /knowledge-base
        - screenshot stato corrente
        - componenti usati
        - permessi già applicati lato frontend
        - mappa interazioni con /admin

F1-002  Stop & Go → proposta schema esteso
        - knowledge_articles (id, title, slug, body_md, category_id,
          author_id, role_visibility[], created_at, updated_at, published)
        - knowledge_categories (id, name, slug, color, icon, sort_order)
        - knowledge_tooltips (id, knowledge_key, label, body_short,
          related_route)
        - backup DB obbligatorio prima di ALTER
        ATTENDO "vai" da Gaetano

F2-002  mockup layout wiki (sidebar categorie + lista articoli + viewer MD)

F1-003  ALTER/CREATE tabelle + seed iniziale con 3 regolamenti

F2-003  componente editor Markdown + viewer + ricerca

F1-004  endpoint CRUD /api/knowledge/articles, /api/knowledge/categories,
        /api/knowledge/tooltips

F2-004  permessi visibilità per ruolo (riusa matrice 5 ruoli)

F1-005  endpoint search full-text

F2-005  integrazione tooltip contestuali nelle altre pagine
        (test su 2-3 pagine pilota)
```

---

## 7. RIFERIMENTI INCROCIATI

### File `_GAE_SVILUPPO` letti in questa sessione
- `_CLAUDE/01_canonici/MASTER_STATUS.md`
- `_CLAUDE/01_canonici/ANALISI_MASTER.md`
- `_ANTIGRAVITY/01_status_continui/00A_GAE_ULTIMI_AGGIORNAMENTI.md`
- `_ANTIGRAVITY/01_status_continui/00B_GAE_Checklist_Operativa.md`
- `_ANTIGRAVITY/01_status_continui/01_Architettura_Core_Server.md`
- `_ANTIGRAVITY/01_status_continui/02_Frontend_Moduli.md`
- `_ANTIGRAVITY/01_status_continui/03_Stato_Lavori_e_Briefing.md`

### File Project Knowledge rilevanti per il seeding futuro
- `staff_e_team_Codice_Disciplinare_Aziendale_TEAM_e_STAFF_SG.md`
- `staff_e_team_Regolamento_aziendale_interno_per_TEAM_e_STAFF_SG.md`
- `utenti_Domanda_Tesseramentoset2025.pdf`
- `utenti_PrivacyeLiberatoriaImmagineadulti.pdf`
- `utenti_PrivacyeLiberatoriaImmagineminori.pdf`
- `utenti_FACSIMILECERTIFICATONONAGONISTICOSTUDIOGEM.pdf`
- `team_mansioni_team.xlsx`
- `2026_04_20_classificazione_stargem_v2.pdf` (classificazione utenti/staff/team)

### Chat correlate (da consultare quando si aprirà operativa)
- **Chat 10 — Utenti GemPortal** (gestisce ruoli e permessi: la Matrix Ruoli è condivisa)
- **Chat 25 — Knowledge Base** ⚠️ (verificare in MASTER_STATUS se esiste duplicazione di numerazione: la lista 27 chat indica "25_Knowledge_Base" mentre la chat in oggetto è la 23. Da chiarire con Gaetano: probabile errore di numerazione nella lista master — questa chat dovrebbe essere la 25, non la 23)
- **Chat 26 — Dashboard** (eventuali widget "ultimi articoli pubblicati" da Knowledge Base)
- **Chat 02 — GemStaff** (i Codici Disciplinari e Regolamenti staff/team alimentano KB)

### ⚠️ NOTA NUMERAZIONE
La lista ufficiale delle 27 chat in apertura cita `25_Knowledge_Base`. Questa chat è stata aperta come "23_Knowledge Base". Da verificare con Gaetano alla riapertura: la numerazione corretta da usare nella nuova chat è probabilmente **25**, non 23.

---

## 8. PROTOCOLLI EMESSI

**Nessuno.** La chat è stata aperta solo per analisi preliminare e proposta di scenari. Non è stato emesso alcun protocollo F1-XXX o F2-XXX.

---

## 9. TABELLE DB TOCCATE

**Nessuna.** Solo lettura documentale, nessuna query eseguita.

---

## 10. PENDENTI PER LA PROSSIMA CHAT

### Decisioni in attesa da Gaetano
1. Scelta scenario A / B / C
2. Regolamenti iscritti in KB articolo o solo PDF
3. Editor Markdown vs WYSIWYG
4. Versioning sì/no

### Azioni operative da fare appena riaperta
1. Verificare numerazione chat (23 vs 25) con Gaetano
2. Leggere il RECAP eventualmente già esistente per Chat 25
3. Emettere F1-001 READ-ONLY (audit `knowledge` table)
4. Emettere F2-001 (audit UI attuale)

### Rischi noti
- La tabella `knowledge` ha già un uso attivo per tooltip admin → qualsiasi ALTER deve preservare i dati esistenti
- Confusione numerazione 23 vs 25 da risolvere prima di iniziare l'esecuzione

---

## 11. STATO PER MASTER_STATUS

Da copiare in `MASTER_STATUS.md` (sezione "🔴 Da iniziare"):

```
## 23_Knowledge_Base — BRIEFING
Stato: 🔴 Da iniziare — F1-001 non emesso
Ultimo protocollo: nessuno
Tabelle DB toccate: nessuna
Pendenti:
  - Scelta scenario (A/B/C) da parte di Gaetano
  - 4 decisioni architetturali aperte
  - Verifica numerazione chat (23 vs 25)
  - Audit READ-ONLY tabella knowledge
PRIMO STEP: F1-001 audit READ-ONLY + lettura KnowledgeBase.tsx
```

---

## 12. NOTE FINALI

Questa chat è stata aperta come prima sessione di analisi. Non è stato emesso alcun protocollo operativo perché — secondo la regola fondamentale — prima di qualsiasi VAI servono le decisioni architetturali da Gaetano.

Il modulo è **già live e funzionante** con la sola Matrix Ruoli. La sua estensione a wiki completo è una scelta strategica che impatta:
- onboarding nuovi operatori (riduce tempo formazione)
- compliance documentale (regolamenti accessibili e versionati)
- riduzione di domande ripetute alla direzione

Il lavoro qui può essere ripreso senza perdita di contesto: tutti i file letti sono nel filesystem, tutti i regolamenti da seedare sono nel Project Knowledge, e la tabella `knowledge` è già esistente.

---

**Fine RECAP — Chat eliminabile.**
