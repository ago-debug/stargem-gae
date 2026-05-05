# RECAP COMPLETO — Chat_24_DB_Monitor
**Data sessione:** 02 Maggio 2026
**Chat:** Chat_24_DB_Monitor (Coordinamento StarGem Suite)
**Stato finale:** 🟡 IN PAUSA — audit completato, implementazione programmata nei tempi morti
**Protocolli eseguiti:** F1-PROTOCOLLO-001 (completato) / F2-PROTOCOLLO-001 (completato)
**Prossimo passo alla ripresa:** F1-002 / F2-002 (implementazione MVP)

---

## 1. OBIETTIVO DELLA CHAT

Costruire un cruscotto interno di monitoraggio del database `stargem_v2` (MariaDB 11.4, 80+ tabelle), visibile solo agli utenti con ruolo `admin` o `root`. Solo lettura — nessuna azione di modifica. Una mappa costante e dettagliata per supportare le decisioni di cleanup e architettura.

### Motivazione reale
Il database è cresciuto in modo disordinato fino a superare le 80 tabelle senza che il fondatore avesse controllo reale su cosa veniva creato, modificato o duplicato dall'agente di sviluppo (Antigravity). Esistono tabelle backup duplicate, tabelle vuote agganciate a moduli mai sviluppati, e una tabella anagrafica principale (`members`) arrivata a 174 colonne con limiti tecnici di row size.

---

## 2. PARAMETRI PRODOTTO DEFINITI (conversazione guidata)

Prima di lanciare gli audit, è stata condotta una serie di domande chiarificatrici per definire vincoli e aspettative.

### 2.1 Stile visivo
Sono stati mostrati tre stili di riferimento:
- **Supabase Studio** — denso, developer-style
- **Prisma Studio** — minimal, pulito
- **Retool** — cruscotto manageriale con card e grafici

Lo stile "denso developer" è stato rifiutato. La richiesta finale:
> "Comodo, funzionale, semplice, intuitivo. Devo capire dove sono le cose e in relazione a cosa."

### 2.2 Linguaggio
Tutto il cruscotto deve usare il linguaggio del gestionale in italiano:
- "Tessere" non "memberships"
- "Soci" non "members"
- "Iscrizioni" non "enrollments"

### 2.3 Funzionalità confermate
| Funzionalità | Decisione |
|---|---|
| Storico modifiche al DB (chi/cosa/quando) | ✅ Confermato — fondamentale per controllare AG |
| Sample data (prime 5 righe per tabella) | ✅ Confermato con privacy mask |
| Alert automatici al superamento soglie | ✅ Confermato |
| Esportazione PDF e CSV | ✅ Confermati entrambi |
| Aggiornamento real-time | ✅ Confermato (non on-demand) |
| Accesso solo admin/root | ✅ Confermato |
| Fase 1 solo lettura | ✅ Confermato |
| Fase 2 con azioni semplici | 🔵 Valutazione futura |

### 2.4 Modernizzazione
Scelta la massima ambizione:
- Feature audaci come Schema Diff, Health Score, AI Natural Query, Command Palette

---

## 3. AUDIT BACKEND (F1-PROTOCOLLO-001)

### 3.1 Stato attuale del codebase backend
| Elemento | Trovato |
|---|---|
| Route admin per introspection DB | ❌ Nessuna |
| Middleware admin-only | ✅ Presente — `isAdmin` in `routes.ts` riga 549 (controlla `req.user.role === 'admin'`) |
| Sistema logging modifiche DB | ⚠️ Parziale — Global Activity Interceptor (righe 587-632) logga solo POST/PUT/PATCH/DELETE via API REST |
| Infrastruttura real-time (WebSocket/SSE) | ❌ Nessuna |
| Connessione DB | ✅ `mysql2` + `drizzle-orm` tramite `server/db.ts` con pool su porta 3307 |
| Libreria CSV | ✅ `PapaParse` già nel progetto |
| Libreria PDF lato server | ❌ Non presente |

### 3.2 Problema critico identificato
L'interceptor attuale non cattura le modifiche fatte da AG via terminale o script SQL diretti — esattamente l'80% delle modifiche che hanno generato il caos delle 80 tabelle. Solo le modifiche via API REST vengono loggiate.

### 3.3 Tecniche per catturare TUTTE le modifiche
| Tecnica | Pro | Contro |
|---|---|---|
| **A. Binary Log** (mysql-events) | Cattura tutto a basso livello — anche script CLI | Richiede privilegi `REPLICATION SLAVE/CLIENT` — IONOS potrebbe non concederli |
| **B. Wrapper DB Pool** | Facile da implementare | Non cattura script CLI di AG |
| **C. Trigger MySQL nativi** | Nativo | Insostenibile su 80 tabelle — scartato |

### 3.4 Strategia cattura modifiche — DECISIONE APPROVATA
**Strategia IBRIDA (C)**
- Wrapper sul DB Pool implementato subito (copertura 80%, sicuro e veloce)
- In parallelo tentativo di attivare il binary log su IONOS
- Se IONOS concede i privilegi → copertura totale
- Se IONOS nega → resta operativo il wrapper
- Nessuna perdita di lavoro in entrambi i casi

### 3.5 Architettura backend proposta
**Endpoint (tutti protetti da middleware `isAdmin`):**
1. `GET /api/admin/db/schema` → mappa completa in cache
2. `GET /api/admin/db/table/:name/sample` → LIMIT 5 con privacy mask
3. `GET /api/admin/db/activity` → ultimi log di sistema
4. `POST /api/admin/db/schema/refresh` → svuota cache e riforza scansione

**Strategia real-time:** Polling intelligente via React Query a 5-10 secondi
- Motivazione: infrastruttura usa già React Query, WebSocket crea problemi con reverse proxy Nginx su IONOS dopo 60 secondi

**Caching:** Metadati schema in RAM Node.js con TTL 5-10 minuti

**Privacy mask:** Regex lato server su: `password`, `hash`, `token`, `otp`, `fiscal_code`, `cf`, `iban` → sostituiti con `[DATO PROTETTO]`

**Alert:** `setInterval` asincrono o `node-cron` con soglie configurabili in `system_configs`

**Export PDF:** Demandato a libreria frontend (jspdf + html2canvas o print HTML nativo)

### 3.6 Modernizzazioni proposte dal backend
1. **Schema Diff automatico** — snapshot notturno JSON della struttura, confronto automatico, badge verde/rosso su nuove tabelle/colonne rimosse/nuovi indici
2. **Health Score e rilevamento orfani** — analisi FK, tabelle non linkate con 0 record da 2+ settimane, % frammentazione indici
3. **AI Natural Query (read-only)** — input in linguaggio naturale, sfrutta `ANTHROPIC_API_KEY` già nel `.env`, filtra schema cacheato senza scrivere SQL

**Stima effort backend:**
| Componente | Effort |
|---|---|
| Mappa schema + cache introspection | S (≤1 giorno) |
| Sample data + masking dinamico | S (≤1 giorno) |
| Activity feed (interceptor esteso) | M (1-3 giorni) |
| Alerting asincrono | S (≤1 giorno) |
| Binary log attempt | M (1-3 giorni) |

---

## 4. AUDIT FRONTEND (F2-PROTOCOLLO-001)

### 4.1 Stato attuale del codebase frontend
| Elemento | Trovato |
|---|---|
| Sezione admin nel menu sinistra | ✅ Sezione "ADMIN/TECNICO" già blindata in `app-sidebar.tsx` |
| Design system | ✅ Tailwind CSS + shadcn/ui (Card, Sheet, Badge, Tabs disponibili) |
| Iconografia | ✅ `lucide-react` |
| Routing | ✅ `wouter` (client-side) |
| Infrastruttura real-time | ✅ Polling via `@tanstack/react-query` |
| Activity feed esistente | ⚠️ Parziale — "Connessioni Live" staff già presente come pattern |

### 4.2 Pattern UX proposto per 80+ tabelle
**Grid di Card Manageriali raggruppate per Dominio**
- Search bar universale in cima per filtro immediato
- Tab logici: CRM & Soci / Didattica / Contabilità / Staff / Sistema / Orfane-Backup
- Ogni card:
  - Titolo in italiano grande ("Tessere")
  - Nome tecnico piccolo grigio ("memberships")
  - Badge conteggio righe (verde se popolata, grigio se vuota)
  - Bordo rosso pulsante se anomalia rilevata
  - Nessun codice o linguaggio developer visibile

### 4.3 Interazione con le card
Click sulla card → si apre **Sheet laterale da destra** (no cambio pagina)

Contenuto dello Sheet:
1. **Prima sezione (enorme):** "📍 Dove si usa nel Gestionale?" con breadcrumb visuale + pulsante "vai alla pagina"
2. **Tab "Struttura":** colonne, tipi, relazioni FK in lista testuale (niente grafo a ragnatela)
3. **Tab "Dati di Esempio":** prime 5 righe con privacy mask già applicata dal server
4. **Relazioni FK:** lista leggibile — "🔗 Dipende da: Soci" / "🔗 Alimenta: Iscritti, Pagamenti"

### 4.4 Activity Feed
Sidebar collassabile destra "Live DB Feed":
- Aggiornamento real-time via polling React Query (ogni 3-5 secondi)
- Entries tipo: "Antigravity ha modificato 5 record in Corsi", "Un utente ha generato un Pagamento"

### 4.5 Mappa Frontend↔DB — DECISIONE APPROVATA
**Strategia IBRIDA**
- Mappatura statica in file di configurazione `db-map-config.ts` (stabile, controllata)
- Script di verifica notturna che confronta la mappa con il DB reale e segnala tabelle non mappate
- Motivazione: la mappa statica da sola porta al rischio "AG aggiunge tabella e si dimentica di aggiornare" — lo script di verifica è la rete di sicurezza

### 4.6 Struttura componenti proposta
| Componente | Scopo |
|---|---|
| `pages/admin/db-monitor.tsx` | Cornice principale con Tab di categoria |
| `components/db-monitor/table-domain-grid.tsx` | Griglia che renderizza le card |
| `components/db-monitor/table-card.tsx` | Singola tessera cliccabile |
| `components/db-monitor/table-details-sheet.tsx` | Pannello laterale scorrevole |
| `components/db-monitor/live-activity-feed.tsx` | Sidebar notifiche real-time |

### 4.7 Modernizzazioni proposte dal frontend
1. **Command Palette universale (Cmd+K)** — stile MacOS Spotlight/Linear, funziona su TUTTO il gestionale (non solo cruscotto), scrivi "trova tabella tessere" o "apri Mario Rossi"
2. **Health Score (gamification 0-100)** — "Salute: 94% — Persi punti per: 3 tabelle orfane, 1.200 discrepanze pagamenti"
3. **Time Machine Diff** — selettore "Confronta con 1 mese fa", tabelle modificate/pulite si illuminano verde (aggiunte) o rosso (eliminate)

**Stima effort frontend:**
| Componente | Effort |
|---|---|
| Layout base + grid card | S |
| Pannello dettagli + sample data + config mappa | M |
| Live activity feed | M |

---

## 5. DECISIONI ARCHITETTURALI APPROVATE (riepilogo)

| Decisione | Scelta approvata |
|---|---|
| Strategia cattura modifiche AG | IBRIDA: wrapper DB Pool subito + tentativo binary log IONOS in parallelo |
| Mappa Frontend↔DB | IBRIDA: `db-map-config.ts` statico + script verifica notturna |
| Modernizzazioni Fase 1 | Schema Diff + Health Score |
| Modernizzazioni Fase 2 | AI Natural Query + Command Palette Cmd+K |
| Real-time | Polling React Query (5-10s backend / 3-5s frontend) |
| Privacy mask | Regex lato server, mai dati sensibili nel payload |
| Export | CSV via PapaParse (già presente) + PDF via libreria frontend |

---

## 6. CAMBIO DI STRATEGIA — PAUSA SU CHAT_24

### 6.1 Motivazione
Il team usa il gestionale ogni giorno e soffre bug visibili:
- Sezioni del menu che non si vedono
- Dati non congrui nelle attività (filtri rotti, conteggi imprecisi)
- Dati imprecisi (numeri, totali, conteggi sbagliati)

Dedicare 10-14 giorni di lavoro AG a un cruscotto interno mentre il gestionale ha bug operativi è una priorità errata.

### 6.2 Le tre strade valutate
| Opzione | Descrizione | Esito |
|---|---|---|
| **STOP completo** | Sospendo Chat_24 e vado sui bug | Scartato: senza vista DB ogni cleanup è alla cieca |
| **MVP rapido** | Cruscotto minimo in 3-4 giorni poi bug | Scartato: il fondatore vuole un cruscotto fatto bene |
| **FULL nei tempi morti** | Prima bug urgenti, cruscotto FULL nei tempi morti | ✅ SCELTO |

---

## 7. SEQUENZA OPERATIVA STRATEGICA DECISA

Il fondatore ha sentito il parere tecnico dell'agente di sviluppo (che raccomandava una sequenza diversa basata sulle dipendenze logiche del codice), ha valutato i pro e contro, e ha deciso di prioritizzare in base ai sintomi più pressanti per il team operativo.

### Sequenza globale approvata

| # | Chat | Cosa si fa | Effort stimato |
|---|---|---|---|
| 1° | **Chat_08_Corsi** | F1-098 filtro categoria + F2-111 filtri mancanti + alert performance + participation_type misto | 2-3 giorni |
| 2° | **Chat_06_Contabilità** | Rollback import pagamenti + 7 campi UI nascosti | 1-2 giorni |
| 3° | **Chat_25_DB_Cleanup FASE A** | DROP 9 tabelle backup spazzatura | Poche ore |
| 4° | **Chat_10_Utenti** | CF validator agganciato + 54 campi anagrafica nascosti | 2-3 giorni |
| 5° | **Chat_05_GemPass** | Bug "—" tessere + bottone Crea Tessera | 1-2 giorni |
| 6° | **Chat_12_Gemdario** | Bug raggruppamento Planning + festività 2026 | 1-2 giorni |
| 7° | **Chat_25_DB_Cleanup FASE B+C** | 30 tabelle vuote + ottimizzazione VARCHAR→TEXT members | 3-5 giorni |
| 8° | **Chat_24_DB_Monitor** | Riprende da F1-002/F2-002 — implementazione cruscotto FULL | ~10-14 giorni |

---

## 8. SCOPERTE E CHIARIMENTI IMPORTANTI

### 8.1 Demistificazione delle aree "🔴 NON TOCCARE"
I file di stato del progetto marcavano Pagamenti e GemPass come sensibili. L'agente ha chiarito la distinzione vera:

| Area | NON toccare | SI può toccare |
|---|---|---|
| **Pagamenti** | POST `/api/payments`, `insertPaymentSchema`, ricalcolo `deposit`/`annual_balance`/`status` | ✅ Aggiungere colonne mancanti in `payments.tsx` e `accounting-sheet.tsx` — l'API già restituisce i dati, rischio zero |
| **GemPass** | POST `/api/memberships`, factory `membership_number`, season competence, logica barcode | ✅ Fix mappatura property "—" in JSX — solo markup, rischio zero. Anche bottone "Crea Tessera" sicuro |

### 8.2 Due alert latenti scoperti
1. **`member_relationships`** (relazioni familiari genitore/tutore) — tabella vuota ma dovrebbe contenere dati → probabile bug nel form anagrafico che non scrive lì → da indagare in **Chat_10_Utenti**
2. **`studio_bookings`** (prenotazioni sale) — tabella vuota ma modulo considerato operativo → probabile che le prenotazioni vengano scritte altrove → da indagare in **Chat BookGem**

### 8.3 Ricalibrazione piano cleanup
Il piano iniziale (da implementation_plan.md) parlava di 13 tabelle spazzatura. L'analisi puntuale di AG ha classificato meglio:
- **9 tabelle DROP sicuro** (tutti backup di import/update aprile, nessun riferimento nel codice)
- **3 tabelle DEPRECATE** (residui vecchi refactoring): `activities`, `universal_enrollments`, `sessions`
- **5 tabelle DUBBIE** (richiedono indagine): `access_logs`, `audit_logs`, `custom_reports`, `member_relationships`, `studio_bookings`
- **~22 tabelle USATE IN FUTURO** (mantenere): `carnet_*`, `gem_*`, `payslips`, `team_*`, `notifications`, ecc.

### 8.4 Tabella members — analisi row size
- Colonne attuali: 129 VARCHAR + 12 TEXT
- 15 candidati per conversione VARCHAR→TEXT identificati:
  - `social_facebook`, `social_instagram`, `social_tiktok`, `social_youtube`, `website`, `drive_folder_url`
  - `company_name`, `company_address`, `education_institute`, `education_title`
  - `emergency_contact1_email`, `emergency_contact2_email`, `emergency_contact3_email`
  - `alias`, `from_where`, `profession`
- Liberazione stimata: ~3.700 byte di row size
- Nessun campo rimosso, solo cambio tipo

### 8.5 Convenzione file di sessione chiarita
Il sistema di documentazione usa **7 file Master persistenti** identificati dalle lettere A-G, aggiornati direttamente da AG ad ogni sessione:

| File | Contenuto |
|---|---|
| **A** | Architettura Backend e DB (mappa moduli, 8 macro-aree, 72 tabelle, regole auree) |
| **B** | Frontend Moduli |
| **C** | Stato Lavori e Briefing (status di ogni sezione con semafori) |
| **D** | Mappa Dati e Frontend |
| **E** | Espansione CRM |
| **F** | Ultimi Aggiornamenti (changelog cronologico) |
| **G** | Checklist Operativa (roadmap con [x] [~] [ ] [!]) |

Non esistono più file con prefissi numerici (00A/00B) — erano una convenzione obsoleta del system prompt iniziale.

---

## 9. OUTPUT PRODOTTI IN QUESTA SESSIONE

### File aggiornati in GAE_SVILUPPO
| File | Aggiornamento |
|---|---|
| **F** (Ultimi Aggiornamenti) | Voce "Aggiornamento 28/04/2026 — Chat_24_DB_Monitor" con sintesi audit e decisioni |
| **G** (Checklist Operativa) | Nuova voce "Cruscotto DB Monitor — 🟡 IN PAUSA" |
| **A**, **B**, **C**, **D**, **E** | Non toccati (nessun cambio architetturale) |

### File nuovo prodotto in GAE_SVILUPPO
**`Z_2026_04_28_REPORT_CLEANUP_DB.md`**
Pronto come base operativa per Chat_25_DB_Cleanup. Contiene:
- FASE A: 9 tabelle DROP sicuro con statement SQL scritto (non eseguito)
- FASE B: ~30 tabelle vuote classificate (USATA IN FUTURO / DEPRECATA / DUBBIA)
- FASE C: Analisi members 174 colonne, 15 candidati VARCHAR→TEXT

---

## 10. ARCHITETTURA CRUSCOTTO (5 strati — per ripresa futura)

Quando si riprenderà Chat_24, la costruzione seguirà 5 strati progressivi. Ogni strato funziona da solo.

### Strato 1 — FONDAMENTA (3-4 giorni)
Vista tabelle in griglia con card per dominio. Pannello laterale con dettagli colonne, relazioni e sample data mascherato. Polling 5-10s. Accessibile solo admin.

### Strato 2 — REGISTRO LIVE (2-3 giorni)
Activity feed real-time. Cattura modifiche via wrapper DB Pool subito + tentativo binary log in parallelo.

### Strato 3 — MAPPA FRONTEND↔DB (2-3 giorni)
Per ogni tabella, breadcrumb "dove si usa nel gestionale" con link diretto alla schermata. Mantenuta con file statico + script verifica notturna.

### Strato 4 — INTELLIGENZA AUTOMATICA (3-4 giorni)
Schema Diff notturno + Health Score 0-100 + Alert automatici + Esportazione PDF/CSV.

### Strato 5 — TOCCO MODERNO (4-5 giorni, opzionale)
Command Palette globale Cmd+K + Query linguaggio naturale via API AI + Time Machine diff visivo.

**Totale effort stimato (tutti e 5 gli strati): ~15-18 giorni**

---

## 11. KIT DI APERTURA PER Chat_08_Corsi

```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_08_Corsi.

PRIMA DI TUTTO leggi nel Progetto Claude:
- A_2026_04_28_1150_Architettura_Core_Server.md
- B_2026_04_28_1150_Frontend_Moduli.md
- C_2026_04_28_1150_Stato_Lavori_e_Briefing.md
- D_2026_04_28_1150_Mappa_Dati_e_Frontend.md
- E_2026_04_28_1150_Espansione_CRM.md
- F_2026_04_28_1150_ULTIMI_AGGIORNAMENTI.md
- G_2026_04_28_1150_Checklist_Operativa.md
- Z_2026_04_28_REPORT_CLEANUP_DB.md
- 2026_04_27_1235_RECAP_COMPLETO_Sessioni_22b.md
  (contesto: 285 SKU riclassificati, participation_type
  misto, smart routing import)

OBIETTIVO DI QUESTA CHAT:
Sistemare le ATTIVITÀ (corsi e lezioni individuali) sulle
pagine /attivita/corsi e /attivita/lezioni-individuali.

CHECKLIST PROBLEMI DA SISTEMARE/VERIFICARE:

[ ] 1. F1-098 — Filtro CATEGORIA rotto
       Su /attivita/corsi il filtro categoria ritorna
       0 risultati. Drafted in chat precedente, mai
       eseguito. Da verificare se ancora valido dopo
       smart routing import.

[ ] 2. F2-111 — Filtri MANCANTI
       Su /attivita/corsi e /attivita/lezioni-individuali
       mancano i filtri per: instructor, giorno della
       settimana, studente. Da implementare.

[ ] 3. ALERT PERFORMANCE filtri client-side
       Segnalato da AG in chiusura Chat_24:
       attualmente i filtri agiscono sui dati già
       caricati nel browser. Con 600+ corsi attuali
       (e crescita futura) il browser inizierà a
       soffrire. Da spostare LATO BACKEND (API con
       query params) per mantenere reattività.

[ ] 4. participation_type MISTO nel DB
       Coesistono nel DB i valori 'corso' e
       'STANDARD_COURSE'. Debito tecnico che genera
       bug a cascata su filtri/conteggi. Da decidere
       quale standard mantenere e UPDATE retroattivo.
       Va risolto prima di toccare GemPass.

[ ] 5. Campi NASCOSTI in UI
       source_file, notes, season_id non mostrati
       attualmente. Verificare se vanno esposti.

[ ] 6. Allineamento UI/dati dopo bonifica Chat_22b
       285 SKU riclassificati nel DB (workshop,
       allenamenti, ecc). Verificare che le pagine
       attività mostrino correttamente le nuove
       activity_type.

AVVERTENZE OPERATIVE:
- Le 9 tabelle backup_op* esistono ancora nel DB
  ma NON vanno droppate qui — competenza Chat_25
- I file Master A-G sono Source of Truth aggiornata
  al 28/04/2026 11:50
- AG aggiorna direttamente A-G ad ogni sessione

SEQUENZA GLOBALE DEL PROGETTO (memoria):
1° Chat_08_Corsi          ← SIAMO QUI
2° Chat_06_Contabilità
3° Chat_25_DB_Cleanup A   (DROP 9 tabelle backup)
4° Chat_10_Utenti
5° Chat_05_GemPass
6° Chat_12_Gemdario
7° Chat_25_DB_Cleanup B+C
8° Chat_24_DB_Monitor     (ripresa cruscotto)

PRIMA AZIONE:
Emetti F1-PROTOCOLLO-001 e F2-PROTOCOLLO-001 di AUDIT
sull'area Attività Corsi/Lezioni. Per ognuno dei 6 punti
della checklist chiedi diagnosi tecnica, approccio
risolutivo, stima effort S/M/L, dipendenze e ordine
raccomandato. AG analizza e propone, Gaetano valuta,
solo dopo VAI.

REGOLE OPERATIVE:
- F1 = AG-Backend · F2 = AG-Frontend
- Stop & Go SEMPRE prima di toccare DB o codice
- Backup DB obbligatorio dopo ogni F1 su tabelle
- Max 1 numero distanza tra F1 e F2
- Deploy manuale Plesk (AG fa solo git commit + push)
- Codice lo scrive sempre Antigravity
- Claude non anticipa mai codice nei prompt
- Ogni risposta AG deve indicare il protocollo

Dev: localhost:5001
DB: stargem_v2 porta 3307 (tunnel locale)
```

---

## 12. PRINCIPI METODOLOGICI CONSOLIDATI IN QUESTA SESSIONE

1. **Mai dare comandi ad AG basati su assunzioni** — prima si leggono i file reali del progetto (A-G), poi si scrivono i prompt
2. **L'agente di sviluppo va consultato come pari** su sequenze di lavoro — conosce le dipendenze invisibili al coordinatore
3. **La decisione finale resta sempre del fondatore** — anche quando si discosta dal parere tecnico
4. **Ogni decisione prima di un VAI** passa attraverso domande con opzioni cliccabili
5. **Il coordinatore non scrive mai codice** — descrive cosa fare e perché, mai come farlo
6. **Quick win prima delle modernizzazioni** — il team operativo ha priorità su qualsiasi feature avanzata
7. **Stop & Go disciplinato** — nessun protocollo nuovo prima che il precedente sia chiuso con risposta AG
8. **Uno strato alla volta** durante la costruzione — ogni strato collaudato prima di passare al successivo

---

## 13. STATO FINALE RIEPILOGATIVO

| Voce | Stato |
|---|---|
| Audit backend F1-001 | ✅ Completato |
| Audit frontend F2-001 | ✅ Completato |
| Decisioni architetturali | ✅ Approvate |
| Implementazione cruscotto | 🟡 In pausa — riprende dopo stabilizzazione gestionale |
| File Master F aggiornato | ✅ Fatto |
| File Master G aggiornato | ✅ Fatto |
| Report cleanup DB (file Z) | ✅ Prodotto e pronto per Chat_25 |
| Briefing aree sensibili (Pagamenti/GemPass) | ✅ Chiarito |
| Sequenza operativa successiva | ✅ Concordata (7 sessioni prima della ripresa) |
| Kit apertura Chat_08_Corsi | ✅ Pronto con checklist integrata |
| Bug urgenti del team | ⏳ Da affrontare — prossima chat è Chat_08_Corsi |

---

*Fine RECAP — Documento generato il 02/05/2026*
*Prossima chat operativa: Chat_08_Corsi*
*Ripresa Chat_24: dopo completamento delle 7 sessioni operative precedenti*
