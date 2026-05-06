# RECAP_07_Gemory
> Cartella: `_GAE_SVILUPPO/_CLAUDE/03_recap_chat/`
> Ultima modifica: 05/05/2026
> Stato: 🟡 In corso — F1-001 / F2-001 emessi, in attesa STOP da Antigravity

---

## 1. OBIETTIVO DELLA CHAT

Trasformare il modulo Gemory da sistema base (todos/team_notes/team_comments)
a **Kanban nativo full-featured** — ispirato a Trello Premium ma con
funzionalità superiori e design nativo StarGem (oro/blu gestionale).

Visione strategica: `tenant_id` su ogni tabella → estraibile come SaaS
standalone in futuro (multi-tenant, branding indipendente).

---

## 2. DECISIONI ARCHITETTURALI PRESE (5/5 — tutte chiuse)

| # | Domanda | Risposta |
|---|---------|----------|
| D1 | ORM | **Drizzle ORM** in `shared/schema.ts` — stesso approccio GemPass |
| D2 | Tabelle esistenti | **Opzione A — additivo.** `todos/team_notes/team_comments` restano intatte. `/gemory` aggrega visivamente senza migrare né deprecare |
| D3 | Maintenance tickets | **Crea `maintenance_tickets` in questa chat.** Non esiste ancora. GemFix (Fase 2) la erediterà |
| D4 | Pulsante "G" | **In `App.tsx` dentro `AppContent`** — stesso punto di TeoCopilot. NON in `app-sidebar.tsx` |
| D5 | Bacheche default | **Opzione A — seed SQL** con 15 nomi da Trello. Nessun import card storiche. Bacheche `(CHIUSO)` → `is_archived=TRUE`. Categorie: UFFICIO / SEGRETERIA / CONDOMINIO |

**Design:** grafica nativa StarGem. Colori solo dove servono per distinguere
bacheche/categorie/priorità. NON replicare estetica Trello — solo funzionalità.

**Nota bacheche:** sono bozze di partenza modificabili/cancellabili liberamente
dal team. Non sono dati obbligatori.

---

## 3. ARCHITETTURA DB — 6 NUOVE TABELLE

### Tabelle da creare (tutte con `tenant_id` per futura estrazione SaaS)

| Tabella | Descrizione |
|---------|-------------|
| `kanban_boards` | Bacheche — con `category`, `color`, `visibility`, `is_archived`, `is_seed` |
| `kanban_lists` | Liste dentro ogni bacheca — con `position` per drag&drop |
| `kanban_cards` | Schede — con `labels` JSON, `checklist` JSON, `attachments` JSON, `priority`, `due_date`, `start_date`, 3 FK opzionali |
| `kanban_card_assignees` | Assegnazioni utenti alle card (many-to-many) |
| `kanban_card_comments` | Commenti threaded con `read_receipts` JSON, `parent_id` per threading |
| `maintenance_tickets` | Ticket manutenzione — creata qui, ereditata da GemFix Fase 2 |

### FK opzionali in `kanban_cards`
```
linked_studio_id           → studios.id
linked_activity_id         → courses.id (STI)
linked_maintenance_ticket_id → maintenance_tickets.id
```

### Ordine CREATE TABLE (rispetta FK)
1. `kanban_boards`
2. `kanban_lists`
3. `maintenance_tickets` ← prima di kanban_cards
4. `kanban_cards`
5. `kanban_card_assignees`
6. `kanban_card_comments`

---

## 4. SEED — 15 BACHECHE DA TRELLO

Fonte: screenshot `gemory_esempio2.png` (Trello reale Studio Gem)

| # | Nome bacheca | Categoria | Archiviata |
|---|-------------|-----------|------------|
| 1 | EVENTI - PROGETTI | UFFICIO | No |
| 2 | COMUNICAZIONE ONLINE-OFFLINE | SEGRETERIA | No |
| 3 | AMMINISTRAZIONE | UFFICIO | No |
| 4 | COLLABORAZIONI, CONVENZIONI, FORNITORI | UFFICIO | No |
| 5 | TEAM - FORMAZIONE | SEGRETERIA | No |
| 6 | PUB - IN VENDITA SG | UFFICIO | No |
| 7 | AFFITTI E LEZIONI INDIVIDUALI | SEGRETERIA | No |
| 8 | SITO SG e WP | UFFICIO | No |
| 9 | SG_ASSISTENZE, MANUTENZIONE, ACQUISTI, PULIZIE | SEGRETERIA | No |
| 10 | SHOP - PUNTO VENDITA - COSTUMI SHOW | SEGRETERIA | No |
| 11 | CONDOMINIO VIGEN. GESTIONE E LAVORI | CONDOMINIO | No |
| 12 | ACCORDI DIREZIONE | UFFICIO | No |
| 13 | SQUADRA ORGANIZZATA | SEGRETERIA | No |
| 14 | TEAM - SEGRETERIA e UFFICIO (orari e mansioni) | SEGRETERIA | **Sì** |
| 15 | CORSI, ATTIVITÀ e GESTIONE STAFF | UFFICIO | **Sì** |

Colori categoria (badge UI):
```
UFFICIO    → bg-blue-100   text-blue-800
SEGRETERIA → bg-purple-100 text-purple-800
CONDOMINIO → bg-amber-100  text-amber-800
```

---

## 5. FUNZIONALITÀ PREVISTE (da implementare nelle fasi successive)

### Vista Bacheche (homepage /gemory)
- Griglia card bacheche con copertina colore/immagine
- Filtro per categoria · Ricerca · Ordina per
- Pulsante "Nuova Bacheca"
- Sezione bacheche archiviate (collassabile)

### Dentro ogni bacheca — 7 viste
Bacheca (drag&drop) · Tabella · Calendario · Timeline · **Gantt con dipendenze** · Dashboard · Mappa

### Card ricche
- Copertina · Label colorate · Assignees (avatar multipli)
- Due date / Start date · Priority
- Checklist (chi ha completato + data/ora)
- Allegati (preview immagini, max 25MB, link Drive)
- Commenti threaded stile WhatsApp

### Read receipts
- "Letto da Mario Rossi, alle ore 14:32"
- Se più utenti: "Letto da 3 persone → espandi"

### Pulsante globale "G"
- Fisso in tutta l'app (bottom-right, z-50)
- Gradiente blu→oro, badge rosso con contatore notifiche non lette
- Click → naviga a /gemory
- Montato in `AppContent` di `App.tsx` — stesso punto di TeoCopilot
- TeoCopilot rimane a destra, G si posiziona a sinistra di Teo

### Sidebar
- Voce "Gemory" con icona `LayoutGrid` (lucide-react)
- Sotto la sezione "Comunicazioni Team"

---

## 6. PROTOCOLLI EMESSI

### F1-PROTOCOLLO-001 — Backend (emesso, in attesa STOP)
**Compito:** Schema Drizzle + CREATE TABLE SQL + Seed 15 bacheche + Backup

Sequenza:
1. STOP: verifica che le 6 tabelle non esistano + COUNT todos/team_notes/team_comments
2. GO: backup PRE → 6 CREATE TABLE → seed 15 bacheche → backup POST
3. Aggiorna `shared/schema.ts` con le 6 definizioni Drizzle
4. Verifica post con SELECT su `information_schema`

### F2-PROTOCOLLO-001 — Frontend (emesso, in attesa STOP)
**Compito:** Scaffolding pagina /gemory + pulsante G + voce sidebar

Sequenza:
1. STOP: grep App.tsx (punto TeoCopilot) + grep sidebar + ls pages/
2. GO: crea `client/src/pages/gemory.tsx` con mock data
3. Aggiunge route `/gemory` in `App.tsx`
4. Monta `GemoryGlobalButton` in `AppContent`
5. Aggiunge voce sidebar
6. `tsc --noEmit` → 0 errori

---

## 7. STATO CORRENTE

```
F1-001: EMESSO — in attesa STOP da AG-Backend
F2-001: EMESSO — in attesa STOP da AG-Frontend

Next step:
  → Gaetano incolla F1-001 in Finestra 1 (AG-Backend)
  → Gaetano incolla F2-001 in Finestra 2 (AG-Frontend)
  → Porta i STOP in questa chat
  → Claude valuta e dà GO a entrambe le finestre
  → Dopo GO: checklist verifica frontend
  → Dopo "tutto funziona": aggiorna MASTER_STATUS
```

---

## 8. FILE DI RIFERIMENTO VISIVO

| File | Contenuto |
|------|-----------|
| `gemory_esempio1.png` | Vista interna bacheca SG_ASSISTENZE — card ricche, labels, checklist, foto allegate + dropdown 7 Viste (Bacheca, Tabella, Calendario, Dashboard, Timeline, Mappa) |
| `gemory_esempio2.png` | Vista "Bacheche" workspace STUDIO GEM — 15 bacheche attive con copertine colorate, categorie UFFICIO/SEGRETERIA/CONDOMINIO |

Questi screenshot sono il **riferimento funzionale** (non estetico) per la UI.

---

## 9. CHAT CORRELATE

| Chat | Relazione |
|------|-----------|
| `03_GemTeam` | `maintenance_tickets` creata qui verrà collegata a GemTeam per ticket manutenzione dei dipendenti |
| `14_BookGem` | Bacheche possono linkare `studio_bookings` |
| `10_Utenti-GemPortal` | Sistema notifiche e `read_receipts` si appoggia agli `users` — stessa architettura auth |
| `Chat_GemFix` (Fase 2) | Erediterà `maintenance_tickets` per modulo dedicato |

---

## 10. AGGIORNAMENTO MASTER_STATUS (da incollare)

```
## 07_Gemory — aggiornato 05/05/2026
Stato: 🟡 In corso
Ultimo protocollo: F1-001 / F2-001 (emessi — in attesa STOP)
Tabelle DB toccate: nessuna ancora (CREATE pendente da GO)
Pendenti:
  - Ricevere STOP da AG-F1 e AG-F2
  - Dare GO dopo verifica
  - Checklist frontend post-GO
  - Conferma "tutto funziona" da Gaetano
  - Dopo v1: F1-002 API CRUD bacheche/liste/card
  - Dopo v1: F2-002 hook React Query reali + drag&drop @dnd-kit
```
