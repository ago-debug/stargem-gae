# CONSULTA — Chat 07_Gemory
> Da incollare nella chat di analisi globale del progetto StarGem Suite
> Scopo: ottenere risposte a 5 decisioni architetturali prima di emettere F1-001

---

## Contesto: cosa stiamo per costruire

La chat **07_Gemory** ha l'obiettivo di trasformare l'attuale modulo Gemory
da sistema base (todo/note/commenti) a **Kanban nativo full-featured**
ispirato a Trello Premium ma con funzionalità superiori.

### Stato attuale di Gemory nel DB
```
Tabelle esistenti:  todos · team_notes · team_comments
Route esistenti:    /todo-list · /commenti
Stato nel MASTER:   ✅ Operativo
```

### Cosa vogliamo aggiungere
```
Nuove tabelle:      kanban_boards · kanban_lists · kanban_cards
                    kanban_card_assignees · kanban_card_comments
Nuove route:        /gemory  (+ API /api/gemory/*)
Feature chiave:     7 viste (Board, Tabella, Calendario, Timeline, Gantt,
                    Dashboard, Mappa) · drag & drop (@dnd-kit)
                    read receipts · checklist tracciate · allegati
                    pulsante globale "G" con badge notifiche
Visione futura:     tenant_id su ogni tabella → estraibile come SaaS standalone
```

---

## Le 4 domande a cui rispondere

### D1 — Stack: Drizzle ORM o Express raw?
Il recap Gemory cita **Drizzle ORM** come ORM. Nel progetto coesistono:
- `shared/schema.ts` con Drizzle (usato in GemPass, Quote & Promo, ecc.)
- Alcune rotte in `server/routes.ts` con query MySQL raw

**Domanda:** Le nuove tabelle `kanban_*` vanno definite in `shared/schema.ts`
con Drizzle (come GemPass), oppure usiamo query raw come in altri moduli?

---

### D2 — Destino delle tabelle esistenti: todos · team_notes · team_comments
Due opzioni:

**Opzione A — Preservare tutto (additivo)**
- `todos`, `team_notes`, `team_comments` restano invariate
- `kanban_*` sono tabelle aggiuntive
- `/todo-list` e `/commenti` continuano a esistere
- `/gemory` è una nuova rotta separata

**Opzione B — Rimpiazzo progressivo**
- Il nuovo `/gemory` diventa l'unica home del modulo
- I dati di `todos` e `team_notes` vengono migrati nelle card kanban
- Le vecchie rotte vengono deprecate gradualmente

**Domanda:** Quale opzione adottare?
(Nota: `team_comments` è probabilmente usata anche da altri moduli —
va verificato prima di toccarla)

---

### D3 — Integrazione con tabelle esistenti
Il recap prevede che ogni card kanban possa essere collegata a:
- `studios` (studio medico / sale)
- `courses` o attività STI (via `linked_activity_id`)
- ticket di manutenzione (quale tabella? `todos`? altra?)
- `members`

**Domanda:** Esistono già tabelle per i "maintenance_tickets" oppure
sono gestiti dentro `todos` con un campo tipo? Dobbiamo creare
una tabella `maintenance_tickets` separata in questa chat o è già prevista
in un'altra (GemTeam? GemFix?)?

---

### D4 — Pulsante globale "G": in quale file va inserito?
Il pulsante fisso "G" (blu/gold, badge notifiche) deve apparire
in **tutta** l'applicazione.

**Domanda:** Il layout globale dell'app è gestito in quale file?
Probabilmente `app-sidebar.tsx` o un componente root tipo `App.tsx` / `layout.tsx`.
Confermare il file corretto dove F2 deve iniettare il pulsante globale.

---

## Informazioni già note (non serve richiederle)

| Dato | Valore |
|------|--------|
| Stack frontend | React 19 + TypeScript + Tailwind + ShadCN/UI |
| Stack backend | Node.js + Express + Drizzle ORM + MariaDB 11.4 |
| DB name | `stargem_v2` |
| Server | VPS IONOS — pm2 porta 5001 |
| Ultimo backup | `pre_nuove_chat_20260412_1901.sql` — 8.9 MB |
| Protocolli Gemory | Partono da F1-001 / F2-001 (nuova chat) |
| Regola tabelle | Prima di qualsiasi DROP: COUNT=0 + grep codebase + nessuna route attiva |

---

### D5 — Migrazione bacheche da Trello: import o ripartenza da zero?

Nel progetto sono presenti due screenshot del Trello reale di Studio Gem
(`gemory_esempio1.png` e `gemory_esempio2.png`). Ti chiedo di guardarli.

Dalla `gemory_esempio2.png` si vedono le **bacheche attualmente in uso**
nello workspace "STUDIO GEM":

```
EVENTI - PROGETTI (accordi e dettagli)
COMUNICAZIONE ONLINE-OFFLINE
AMMINISTRAZIONE
COLLABORAZIONI, CONVENZIONI, FORNITORI
TEAM - FORMAZIONE (strumenti, manuali)
PUB - IN VENDITA SG
AFFITTI E LEZIONI INDIVIDUALI
SITO SG e WP (parte tecnica online)
SG_ASSISTENZE, MANUTENZIONE, ACQUISTI, PULIZIE
(CHIUSO) TEAM - SEGRETERIA e UFFICIO (orari e mansioni)
SHOP - PUNTO VENDITA - COSTUMI SHOW in sede
CONDOMINIO VIGEN. GESTIONE E LAVORI
(CHIUSO) CORSI, ATTIVITÀ e GESTIONE STAFF
ACCORDI direzione
Squadra Organizzata: Efficienza che Brilla
```

Le categorie utenti visibili sono: **UFFICIO · SEGRETERIA · CONDOMINIO**

Dalla `gemory_esempio1.png` si vede la struttura interna di una bacheca
(SG_ASSISTENZE) con liste, card ricche, allegati, checklist, labels —
e il **menu Viste** con le 7 opzioni: Bacheca, Tabella, Calendario,
Dashboard, Timeline, Mappa.

**Domanda:** Per il lancio di Gemory, le bacheche sopra elencate vanno:
- **A) Pre-popolate automaticamente** come bacheche default al primo avvio
  (usando i nomi reali dal Trello, senza i dati storici delle card)
- **B) Importate con i contenuti** tramite export JSON da Trello API
- **C) Ripartenza da zero** — l'utente crea le bacheche manualmente

(Le card storiche non sono necessarie nella v1 — ma la struttura
bacheche + liste default può essere pre-caricata da seed SQL)

---

## 📎 File di riferimento visivo nel progetto

| File | Contenuto |
|------|-----------|
| `gemory_esempio2.png` | Vista "Bacheche" del workspace STUDIO GEM su Trello — 15 bacheche attive con copertine, categorie UFFICIO/SEGRETERIA/CONDOMINIO |
| `gemory_esempio1.png` | Vista interna bacheca SG_ASSISTENZE — card ricche, labels, checklist, allegati fotografici + dropdown 7 Viste aperto (Bacheca, Tabella, Calendario, Dashboard, Timeline, Mappa) |

Questi screenshot sono il **riferimento visivo esatto** per la UI di Gemory.
F2 deve replicare fedelmente questo layout.

---

## Output atteso da questa consulta

Risposte alle 5 domande sopra, dopo di che la chat 07_Gemory emetterà:

- **F1-001** — Definizione schema Drizzle per le 5 tabelle `kanban_*`
  + migrazioni SQL + seed bacheche default (se opzione A per D5)
  + backup pre-intervento
- **F2-001** — Struttura pagina `/gemory` (vista Bacheche identica a gemory_esempio2.png)
  + pulsante globale "G" + hook base React Query per `kanban_boards`
