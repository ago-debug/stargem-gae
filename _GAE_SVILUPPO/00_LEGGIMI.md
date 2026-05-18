---
tags: [regole, filesystem]
aggiornato: 2026-05-15T19:30
tipo: regole
---

# 📂 GAE_SVILUPPO — Cartella di scambio StarGem Suite

> Collegati: [[00_INDEX]] · [[ISTRUZIONI_COWORK_2026_05_05]] · [[MASTER_STATUS]] · [[ANALISI_MASTER]]


Punto di sincronizzazione tra **Gaetano** (proprietario), **Claude**
(coordinatore, via MCP filesystem da Claude Desktop) e **Antigravity**
(esecutore codice, via accesso diretto al filesystem).

---

## 🗂️ Struttura: due territori separati

La cartella si divide in due aree con padroni distinti, più un archivio condiviso.

```
_GAE_SVILUPPO/
│
├── 00_LEGGIMI.md                   ← questo file (regole permanenti)
│
├── _CLAUDE/                        ← territorio CLAUDE (lettura + scrittura)
│   ├── 01_canonici/                ← MASTER_STATUS, ANALISI_MASTER
│   ├── 02_moduli_analisi/          ← documenti analitici trasversali (H, I, ...)
│   ├── 03_recap_chat/              ← RECAP delle 27 chat moduli + _TEMPLATE
│   └── 04_per_antigravity/         ← prompt e protocolli che Claude lascia per AG
│
├── _ANTIGRAVITY/                   ← territorio ANTIGRAVITY (lettura + scrittura)
│   ├── 01_status_continui/         ← A→G + Z (file di status che AG aggiorna sempre)
│   ├── 02_output_protocolli/       ← audit, report Stop&Go, status backend/frontend
│   └── 03_codice_in_lettura/       ← snapshot codice quando Claude lo richiede
│
└── 99_archivio/                    ← archivio condiviso (sola consultazione)
                                       versioni vecchie con timestamp
```

---

## 📐 Regole permanenti

### 1. Territori separati — non si invade

- **`_CLAUDE/`** → solo Claude e Gaetano modificano. AG legge ma non scrive.
- **`_ANTIGRAVITY/`** → solo AG modifica. Claude legge ma non scrive.
- **`99_archivio/`** → entrambi possono archiviarci, nessuno modifica file dentro.

Questa è la regola d'oro. Senza disciplina su questo, i due sistemi si pestano i piedi.

### 2. Nome fisso per i file vivi (no timestamp nel nome)

Tutti i file "vivi" usano un nome fisso senza timestamp. Esempi:
- `_CLAUDE/01_canonici/MASTER_STATUS.md` (non `2026_04_28_MASTER_STATUS.md`)
- `_ANTIGRAVITY/01_status_continui/A_Architettura_Core_Server.md` (non `A_2026_04_28_1150_...`)
- `_CLAUDE/03_recap_chat/RECAP_08_Corsi.md`

Quando un file viene modificato, **prima di sovrascriverlo** copia la versione
precedente in `99_archivio/` con prefisso timestamp:
- `99_archivio/2026_04_28_1500_MASTER_STATUS.md`
- `99_archivio/A_2026_04_28_1150_Architettura_Core_Server.md`

Formato timestamp obbligatorio: `YYYY_MM_DD_HHMM`.

### 3. Fonte unica di verità — solo MCP filesystem

Gaetano ha scelto di lavorare **esclusivamente da Claude Desktop con MCP attivo**.
Questa cartella (`_GAE_SVILUPPO/`) è l'unica fonte di verità del progetto.

Il Progetto Claude su claude.ai (project knowledge) NON viene più sincronizzato.
I file vivi vivono solo qui sul filesystem locale.

**⚠️ Avviso browser/mobile**: se Claude viene aperto da browser o mobile (senza MCP),
deve avvisare immediatamente Gaetano che NON può accedere ai dati live e che le
decisioni prese in quella sessione potrebbero essere basate su informazioni
vecchie o assenti. Il check è obbligatorio all'inizio di ogni sessione.

### 4. Claude non scrive mai codice del progetto StarGem

Claude opera SOLO dentro `_GAE_SVILUPPO/`. `schema.ts`, route, componenti
React, migrazioni: tutto fuori da qui è territorio esclusivo di AG.

### 5. AG non committa `_GAE_SVILUPPO/` senza ordine esplicito

I file qui dentro non finiscono in produzione. Eventuali commit vengono
decisi caso per caso da Gaetano.

### 6. Backup prima di toccare i canonici

Prima di ogni modifica a MASTER_STATUS o ANALISI_MASTER, copia la versione
corrente in `99_archivio/` con timestamp. Stessa regola per A→G+Z di AG.

### 7. RECAP per chat — formato standard obbligatorio

Ogni chat modulo (Chat_01...Chat_27) ha un proprio file recap in
`_CLAUDE/03_recap_chat/RECAP_NN_NomeChat.md`. Il formato è dettato dal
template `_CLAUDE/03_recap_chat/_TEMPLATE_RECAP.md` — non è opzionale,
è il linguaggio comune che permette alle chat di leggersi a vicenda.

A fine sessione, ogni chat modulo:
1. aggiorna il proprio RECAP nel formato standard;
2. solo dopo, aggiorna i 4 campi standard di MASTER_STATUS.md.

### 8. Comunicazione tra chat — il file è l'unico canale

Le chat di Claude NON si parlano direttamente. Tutto ciò che una chat deve
comunicare alle altre va scritto in un file di questa cartella. Quello che
resta solo nella conversazione interna è invisibile alle altre chat.

La chat di Analisi (senza numero) legge tutti i RECAP e produce decisioni
condivise in `_CLAUDE/01_canonici/` e `_CLAUDE/02_moduli_analisi/`. Le chat
operative leggono `_CLAUDE/01_canonici/` + il proprio RECAP + i RECAP delle
chat correlate (sezione 8 del template).

### 9. Apertura sessione chat modulo — checklist

All'inizio di ogni sessione di chat modulo, Claude deve leggere in ordine:
1. `00_LEGGIMI.md` (questo file)
2. `_CLAUDE/01_canonici/MASTER_STATUS.md` + `_CLAUDE/01_canonici/ANALISI_MASTER.md`
3. `_CLAUDE/03_recap_chat/RECAP_NN_NomeChat.md` (proprio recap, se esiste)
4. `_CLAUDE/03_recap_chat/RECAP_NN_*.md` delle chat correlate
5. `_CLAUDE/04_per_antigravity/` se ci sono protocolli attivi
6. Eventualmente `_ANTIGRAVITY/01_status_continui/F_ULTIMI_AGGIORNAMENTI.md`
   per capire le novità più recenti dal lato esecuzione

Senza questa lettura, la sessione parte cieca.

### 10. Interazione Claude ↔ Antigravity

**Nei prompt da Claude verso AG**, includere sempre in testa la lista
esplicita dei file di GAE_SVILUPPO che AG deve leggere prima di procedere:
```
PRIMA AZIONE OBBLIGATORIA: leggi
- _GAE_SVILUPPO/_CLAUDE/01_canonici/MASTER_STATUS.md
- _GAE_SVILUPPO/_CLAUDE/03_recap_chat/RECAP_NN_NomeChat.md
Poi procedi con [istruzione operativa]...
```

**Output strutturati di AG** (audit, report, status che vanno consultati
in altre sessioni) vanno salvati in `_ANTIGRAVITY/02_output_protocolli/`
con nome significativo e timestamp:
- `audit_F1-NNN_YYYY_MM_DD.md`
- `status_backend_YYYY_MM_DD.md`
- `report_stop_go_F1-NNN.md`

Gli output effimeri (singole risposte conversazionali) restano in chat.

### 11. Snapshot di codice per analisi Claude

Quando Claude ha bisogno di vedere un pezzo di codice del progetto per
ragionarci sopra (senza modificarlo), chiede ad AG di salvare uno snapshot
in `_ANTIGRAVITY/03_codice_in_lettura/`:
```
schema_snapshot_YYYY_MM_DD.ts
```
Claude lo legge via MCP, ragiona, risponde. A fine sessione AG (o Gaetano)
elimina lo snapshot. Il codice di produzione non viene mai toccato da Claude.

### 12. Regole assolute per AG (non eccezioni)

- AG NON modifica i file in `_CLAUDE/` (qualsiasi sottocartella)
- AG NON committa `_GAE_SVILUPPO/` senza ordine esplicito di Gaetano
- AG NON deploya in produzione (solo `git commit` + `git push origin main`,
  poi STOP — il deploy lo fa Gaetano via Plesk)
- AG NON anticipa decisioni architetturali — esplora e propone, Gaetano decide

### 13. Convenzione `tenant_id` per nuove tabelle (preparazione SaaS multi-tenant)

Aggiunta dopo lo strategic review 2026-05-11 (F1 raccomandazione).
**Qualunque tabella creata da oggi in poi** deve includere:

```sql
tenant_id VARCHAR(50) NOT NULL DEFAULT '1'
```

Inoltre, ogni nuovo vincolo `UNIQUE` deve essere chiave composita che include `tenant_id`:
- `UNIQUE(tenant_id, email)` anziché `UNIQUE(email)`
- `UNIQUE(tenant_id, fiscal_code)` anziché `UNIQUE(fiscal_code)`

Costo oggi: trascurabile. Beneficio: evita 6-12 mesi di refactor al momento della migrazione SaaS multi-tenant. Le tabelle pre-2026-05-11 verranno migrate gradualmente nel piano multi-tenant.

### 14. Validazione automatica forzata in Stop & Go

Aggiunta dopo lo strategic review 2026-05-11 (F1 raccomandazione).
Prima di chiudere un protocollo Stop & Go che ha modificato codice, AG deve eseguire (e riportare l'esito) di:

```bash
npx tsc --noEmit              # zero errori TypeScript obbligatori
npm run lint                   # zero errori lint obbligatori
npm test                       # se esistono test su quel modulo, devono passare
npm run build                  # se le modifiche toccano file di entry o config
```

Output nel report Stop & Go: blocco `## Validazione automatica` con esito di ogni comando. Se uno fallisce: ferma il protocollo, descrivi l'errore, non chiudere il task.

Eccezione: Stop & Go di sola analisi/lettura senza modifiche al codice non richiedono validazione.

### 15. Tracciabilità OBBLIGATORIA dei lavori AG in `_ANTIGRAVITY/`

Aggiunta dopo il reset totale del 2026-05-11 (Gaetano ha rilevato che AG aveva fatto lavori non tracciati nei file di status, e Claude operava su info datate).

**Ogni Stop & Go chiuso da AG deve produrre OBBLIGATORIAMENTE:**

1. **Aggiornamento di `_ANTIGRAVITY/01_status_continui/F_<timestamp>_ULTIMI_AGGIORNAMENTI.md`** (il file più letto come bibbia del contesto): aggiunta in cima della nota di chiusura del task, con data e descrizione 2-3 righe.
   - Se il file F_ esistente è recente (stesso giorno): aggiungi nota in cima senza creare nuovo file.
   - Se il file F_ esistente è di un giorno precedente: archivia il vecchio in `99_archivio/` con timestamp e crea il nuovo `F_<YYYY_MM_DD_HHMM>_ULTIMI_AGGIORNAMENTI.md`.

2. **Aggiornamento del file A→G o Z pertinente** se il lavoro tocca un'area specifica (es. lavoro su backend → aggiorna `A_*` se architettura, `C_*` se stato lavori; lavoro su frontend → aggiorna `B_*`; lavoro su DB → aggiorna `D_*`; lavoro su sicurezza/pruning → aggiorna `Z_*`).

3. **Report completo in `_ANTIGRAVITY/02_output_protocolli/`** con nome convenzionale: `report_F1-NNN_<topic>_<YYYY_MM_DD>.md` o `audit_F1-NNN_<topic>_<YYYY_MM_DD>.md`. Niente lavoro non documentato.

4. **Se il lavoro modifica il DB** (CREATE/ALTER/DROP/INSERT massivo): documentare in `Z_<timestamp>_REPORT_<topic>_DB.md` con prima/dopo i conteggi delle tabelle toccate.

**Eccezione:** sessioni di sola lettura/analisi per Gaetano (audit on-demand) richiedono comunque il report in `02_output_protocolli/` ma non l'aggiornamento di F_ se non chiudono protocolli operativi.

**Violazione = causa di disallineamento tra documentazione e codice reale**, esattamente il problema che ha portato al reset del 2026-05-11. La tracciabilità non è opzionale.

### 16. Validità temporale dei file canonici e verifica obbligatoria pre-intervento

Aggiunta dopo il reset totale del 2026-05-11 (Gaetano: "Lo storico è lo storico, ma se facciamo fare interventi vecchi facciamo un casino").

**Principio:** un file canonico non è "vero per sempre". Ha una **data di ultima verifica** rispetto al codice reale. Più tempo passa, più è probabile che sia disallineato.

**Ogni file canonico vivo deve avere nel frontmatter:**
```yaml
---
aggiornato: YYYY-MM-DD
ultima_verifica_vs_codice: YYYY-MM-DD
fonti_verificate:
  - path/al/file/o/audit/usato
---
```

Quando manca `ultima_verifica_vs_codice` o è uguale a `aggiornato`, il file ha lo stesso valore di affidabilità della sua data.

**Decadimento di affidabilità (regole di default):**

| Tipo file | Validità prima della re-verifica |
|---|---|
| `MASTER_STATUS.md` | 7 giorni |
| `ANALISI_MASTER.md` | 30 giorni (cambia raramente, è strategia) |
| `F_*_ULTIMI_AGGIORNAMENTI.md` | 3 giorni (storia recente) |
| `RECAP_NN_*.md` modulo specifico | 14 giorni dall'ultima modifica al codice del modulo |
| Audit / report puntuali in `_ANTIGRAVITY/02_output_protocolli/` | Sempre (sono fotografie datate, non file vivi) |

**Procedura obbligatoria PRIMA di pianificare un intervento:**

1. Verifica nel frontmatter del/dei file canonici che useresti come base: `ultima_verifica_vs_codice` è entro la finestra di validità?
2. Se SÌ → usa il file come fonte e procedi
3. Se NO → chiedi ad AG un mini-audit di verifica della parte rilevante (può essere 15-30 min, basta poco) PRIMA di lanciare l'intervento vero. Aggiorna il `ultima_verifica_vs_codice` con la nuova data e la nota dell'audit.

**Storico vs vivo:**
- **File "vivi"** (in `_CLAUDE/01_canonici/`, `_CLAUDE/03_recap_chat/`, `_CLAUDE/04_per_antigravity/`, `_ANTIGRAVITY/01_status_continui/`): vanno mantenuti aggiornati e verificati. Il decadimento si applica a questi.
- **File "storici"** (in `99_archivio/`): non si toccano e non guidano interventi. Possono essere CONSULTATI come riferimento, ma una loro citazione in una decisione operativa DEVE essere accompagnata da verifica corrente vs codice. *"Lo dice il vecchio MASTER_STATUS"* non è un argomento valido per un intervento.

**Violazione = causa di rifare lavori già fatti o di rompere cose appena sistemate.** Esattamente il problema del 11/05.

### 17. Timestamp con ORA obbligatorio nel frontmatter

Aggiunta dopo richiesta di Gaetano il 2026-05-11: *"È una regola importantissima. Così abbiamo in tempo reale quando sono stati aggiornati."*

Tutti i file canonici vivi (sia in `_CLAUDE/` sia in `_ANTIGRAVITY/`) devono avere nel frontmatter **data + ora** in formato ISO 8601 esteso:

```yaml
---
aggiornato: 2026-05-11T16:45
ultima_verifica_vs_codice: 2026-05-11T16:45
validita_prevista: 7 giorni (scade 2026-05-18T16:45)
fonti_verificate:
  - path/al/file
---
```

**Formato obbligatorio:** `YYYY-MM-DDTHH:MM` (es. `2026-05-11T16:45`). NON `2026-05-11` (solo data).

**Vale per:**
- Tutti i canonici `_CLAUDE/01_canonici/*`
- Tutti i RECAP `_CLAUDE/03_recap_chat/*`
- Tutti i file vivi `_ANTIGRAVITY/01_status_continui/*` (A, B, C, D, F, G, H, Y, Z, ecc.)
- Tutti i moduli analisi `_CLAUDE/02_moduli_analisi/*`
- Output protocolli con valore "vivo" `_ANTIGRAVITY/02_output_protocolli/*`

**Vale per Claude e per Antigravity.** Niente eccezioni. Tutti i file vanno timbrati con la data+ora reale dell'ultimo aggiornamento.

Quando crei un file ex novo o lo aggiorni: usa `date +%Y-%m-%dT%H:%M` da bash, o equivalente, per ottenere il timestamp corrente.

### 18. Numerazione progressiva dei prompt Claude → Antigravity

Aggiunta dopo richiesta di Gaetano il 2026-05-11: serve un meccanismo di tracciamento univoco per non perdere il conto di cosa è stato chiesto e cosa è stato eseguito.

**Convenzione:**
- Ogni prompt che Claude (Cowork) invia ad AG deve avere un **numero progressivo** nella forma `F1-NNN` (per AG Backend) o `F2-NNN` (per AG Frontend).
- La numerazione è **progressiva globale** per ciascun asse (F1 e F2 sono numerazioni separate).
- Parte da `001` con il prossimo prompt che Claude scrive (post 2026-05-11T19:11).
- **Non si resetta** mai.

**Riferimento incrociato nei file:**
- AG deve riportare il numero del prompt all'inizio di ogni sua risposta operativa, es. `"Risposta F1-007 — Audit Anagrafica Backend"`.
- Il numero deve apparire anche nel **nome del file di output** che AG produce, es. `audit_F1-007_anagrafica_2026_05_11.md`, `report_F2-005_fix_X_2026_05_11.md`.
- L'aggiornamento di `F_*_ULTIMI_AGGIORNAMENTI.md` deve includere il numero del prompt chiuso.

**Indice dei prompt:**
Claude mantiene un indice cronologico in `_CLAUDE/04_per_antigravity/INDEX_PROMPT.md` (lista F1 e F2 separate, con data, topic, file di output prodotto). L'indice si aggiorna ad ogni nuovo prompt inviato.

**Storico (pre-2026-05-11T19:11):** i numeri usati nei nomi file precedenti (es. `report_F2-001_fix_4_errori_ts_2026_05_11.md`) sono retrospettivi e restano dove sono. La nuova numerazione progressiva parte da 001 con i prompt successivi a questo articolo.

### 19. Checklist progetto canonica sempre aggiornata

Aggiunta dopo richiesta di Gaetano il 2026-05-11: serve una vista d'insieme delle cose fatte / in corso / da fare di tutto il progetto, aggiornata ad ogni cambio di stato.

**File canonico:** `_CLAUDE/01_canonici/CHECKLIST_PROGETTO.md`

**Sezioni obbligatorie:**
1. **✅ Completato** — cose chiuse con data
2. **🟡 In corso** — cose attualmente in lavorazione (chi, cosa, da quando)
3. **📋 Backlog prossimi** — cose pianificate prossime, in ordine di priorità
4. **🚫 Bloccato / Decisioni pendenti** — cose ferme in attesa di qualcosa/qualcuno
5. **🗑️ Archiviato / Cancellato** — cose esplicitamente cancellate con motivazione

**Regole di aggiornamento:**
- Claude (Cowork) la aggiorna **ad ogni cambio di stato** (task chiuso da AG, decisione presa da Gaetano, piano nuovo aggiunto)
- Frontmatter conforme regola 17 (timestamp con ora) + regola 16 (`ultima_verifica_vs_codice`)
- Voci linkate al file/audit/recap di riferimento quando applicabile (wikilink `[[nome_file]]`)
- Per task con numero prompt: includere F1-NNN / F2-NNN nella voce

**Quando consultarla:** prima di iniziare qualunque task operativo, controllare la checklist per non duplicare lavoro e per vedere se ci sono dipendenze.

### 20. Comunicazione Claude → Gaetano: sempre con opzioni multiple

Aggiunta dopo richiesta di Gaetano il 2026-05-11.

Quando Claude (Cowork) pone una domanda decisionale a Gaetano, **deve sempre presentare 2-4 opzioni esplicite e numerate**, mai domande aperte tipo *"cosa preferisci?"*. Esempio corretto:
> "Procediamo col piano refactor?
> (a) Sì, lancia subito F1-002 + F2-002
> (b) Sì, ma rivediamo prima il piano
> (c) No, fermiamoci"

Quando possibile usare il tool `AskUserQuestion` per rendere le opzioni cliccabili.

Domande aperte senza opzioni = vietate (perdono tempo a Gaetano).

### 21. Ordine canonico dei prompt: F1 SEMPRE PRIMA di F2

Aggiunta dopo richiesta esplicita di Gaetano il 2026-05-12 (la regola era già in ISTRUZIONI_COWORK ma Claude l'ha violata).

**Quando Claude mostra a Gaetano due (o più) prompt da incollare nello stesso messaggio:**

- **F1 (Backend) sempre PRIMA**, in alto
- **F2 (Frontend) sempre DOPO**, in basso
- Se esistono altri agenti futuri (es. F3), l'ordine sarà F1 → F2 → F3, sempre crescente

Vale anche quando il task F1 è ancora in attesa di applicazione e quello F2 è già un OK semplice. **L'ordine è F1 sopra F2 sotto, sempre.**

Vale anche nei file di prompt che Claude crea in `_CLAUDE/04_per_antigravity/`: le sezioni F1 vanno prima delle sezioni F2.

**Motivazione:** Gaetano legge dall'alto. Avere ordine fisso evita confusione e velocizza il copia-incolla operativo.

### 22. Wikilink Obsidian obbligatori nei file vivi del vault

Aggiunta dopo richiesta di Gaetano il 2026-05-12T14:15: tutto deve essere navigabile dal grafo Obsidian.

**Regola:**
Quando un file VIVO del vault (in `_CLAUDE/` o `_ANTIGRAVITY/01_status_continui/`) referenzia un ALTRO file del vault, deve usare la sintassi wikilink `[[NomeFile]]` (senza `.md`) invece del path testuale `_CLAUDE/cartella/NomeFile.md`.

**Vale in particolare per `_ANTIGRAVITY/01_status_continui/`:**
- Tutti i file faro A→G + Y + Z devono usare wikilink quando citano:
  - Altri file faro (es. `[[A_2026_05_11_Architettura_Core_Server]]`)
  - File canonici (es. `[[MASTER_STATUS]]`, `[[CHECKLIST_PROGETTO]]`, `[[00_LEGGIMI]]`)
  - RECAP e audit (es. `[[audit_F1-002_anagrafica_approfondito_2026_05_11]]`)
  - Documenti di analisi (es. `[[piano_refactor_anagrafica_2026_05_11]]`)

**Vale per tutti i file vivi:**
- `_CLAUDE/01_canonici/`
- `_CLAUDE/02_moduli_analisi/`
- `_CLAUDE/03_recap_chat/`
- `_CLAUDE/04_per_antigravity/` (file documentali, NON i prompt copia-incolla)
- `_CLAUDE/06_per_cowork/`
- `_ANTIGRAVITY/01_status_continui/`
- `_ANTIGRAVITY/02_output_protocolli/` (report e audit, dove referenziano altri file)

**Eccezioni — dove NON usare wikilink:**
1. **Prompt copia-incolla per AG** (es. blocchi di codice ` ``` ` dentro file in `_CLAUDE/04_per_antigravity/`): AG non interpreta wikilink, gli serve il path completo `_GAE_SVILUPPO/_CLAUDE/...`. Wikilink solo nei file documentali del vault, non nei prompt operativi.
2. **Path a file di codice del progetto StarGem** (es. `server/routes.ts:1234`): non sono nel vault Obsidian, restano come path testuale.
3. **Path a screenshot/PDF in `_CLAUDE/05_allegati/`**: il path testuale è cliccabile da Obsidian come "Link to file", non serve wikilink. Se vuoi farli apparire come nodi nel grafo, usa embed `![[nome.png]]`.

**Motivazione:** il grafo Obsidian disegna i collegamenti SOLO tra wikilink. Senza wikilink i file restano isolati come "nodi orfani" → il grafo perde di significato. Con wikilink ovunque, il grafo diventa un cervello visuale navigabile per Gaetano e per Claude in sessioni future.

**AG obbligo:**
Quando AG modifica/crea un file faro o di output, deve usare wikilink come da regola. La validazione finale di Stop & Go (regola 14) include controllo che NON ci siano path testuali a file del vault dove sarebbe richiesto wikilink.

### 23. Verifica allineamento Drizzle ↔ DB dopo OGNI migration

Aggiunta dopo F1-028 (15/05/2026) — bug `/calendario-attivita` causato da Drizzle schema disallineato dal DB.

**Regola:**
Dopo qualsiasi `ALTER TABLE`, `DROP COLUMN`, `RENAME COLUMN`, `CREATE TABLE` (o equivalente migration Drizzle), AG deve OBBLIGATORIAMENTE:

1. Eseguire `DESCRIBE <tabella>` su MySQL e ottenere lista colonne reali
2. Confrontare con definizione Drizzle in `shared/schema.ts`
3. Se differenze rilevate (colonne in Drizzle ma non in DB, o viceversa), APPLICARE migration mancanti finché allineato
4. Se MySQL rifiuta ALTER per "Row size too large" o altro vincolo, usare `SET SESSION innodb_strict_mode=OFF;` o convertire VARCHAR a TEXT per liberare row size (vedi F1-019, F1-026)

**Smoke test obbligatorio post-allineamento:**
- `npx tsc --noEmit` → exit 0
- curl `/api/health` → 200
- curl 5+ endpoint critici (`/api/members`, `/api/instructors`, `/api/payment-methods`, `/api/courses`, eventualmente `/api/calendario-attivita`) → tutti 200
- Se anche UNO fallisce → diagnosticare causa + fix prima di chiudere Stop & Go

**Motivazione:** Vite hot-reload propaga modifiche TypeScript ma non vede divergenze schema. Bug DB ↔ codice esplodono a runtime (ER_BAD_FIELD_ERROR, ER_NO_SUCH_TABLE). Senza smoke test, problemi emergono solo quando un utente apre una pagina.

### 24. Grep preventivo prima di DROP/RENAME schema

Aggiunta dopo F1-028 (15/05/2026) — drop legacy mother_/father_/bio/specialization aveva lasciato reference rotti in routes.ts.

**Regola:**
Prima di eseguire `DROP COLUMN`, `RENAME COLUMN` o eliminazione di entità Drizzle, AG deve:

1. `grep -rn "<old_name>" server/ shared/ client/` (case-insensitive se serve)
2. Identificare TUTTI i reference (codice TS, Drizzle queries, label UI, alias dictionaries)
3. Fixare codice PRIMA della migration (così il vecchio codice non gira più sul vecchio campo quando il campo sparisce)
4. ALTER TABLE → tsc → smoke test (vedi regola 23)

**Eccezioni:**
- Reference in audit_logs o changelog storici → lasciare (sono dati storici, non codice attivo)
- Reference in commenti `// TODO` → ok rimanere, ma rimuovere se sono indicazioni di rifattorizzare

**Motivazione:** "Drop senza grep" = bomba a tempo. Tutto compila (TypeScript non vede colonne DB) ma a runtime ER_BAD_FIELD esplode.

### 25. Backup DB obbligatorio prima migration distruttive

Aggiunta dopo F1-026, F1-027 (15/05/2026) — entrambi avevano DROP COLUMN che rompeva dati se errore.

**Regola:**
Prima di QUALSIASI migration che modifica struttura (ADD/DROP/RENAME COLUMN, CREATE/DROP TABLE), AG OBBLIGATORIAMENTE:

1. Esegue `mysqldump` dell'intero schema con dati: `mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME > backups/pre_<task_id>_<timestamp>.sql`
2. Verifica file generato (non zero bytes, contiene `INSERT INTO`)
3. Documenta path nel report Stop & Go
4. Solo dopo procede con migration

**Cartella backups/:**
- Esiste o creata in root progetto (gitignored)
- Pulizia automatica > 30 giorni (cron successivo)
- Ogni backup prima di migration distruttiva preserva 1 settimana minimo

**Motivazione:** se ALTER va male (es. character set incompatibile), serve rollback rapido. Senza backup → ore di debug + rischio dati persi.

### 26. Migration scripts IDEMPOTENTI

Aggiunta dopo F1-021b, F1-026 (15/05/2026) — script applicati 2 volte causavano errori ER_DUP_FIELDNAME, ER_DUP_KEYNAME.

**Regola:**
Tutti gli script di migration (ADD/DROP/RENAME COLUMN, CREATE TABLE, ALTER) devono essere idempotenti = lanciabili più volte senza danno.

**Pattern obbligatori:**
- `CREATE TABLE IF NOT EXISTS` invece di `CREATE TABLE`
- Prima di ADD COLUMN: query `DESCRIBE` o `SHOW COLUMNS LIKE 'col_name'` → se esiste, skip
- Prima di DROP COLUMN: stesso check, se non esiste skip
- Prima di RENAME: check su entrambi i nomi (vecchio + nuovo)
- Per indici: `CREATE INDEX IF NOT EXISTS` (MariaDB 10.4+) o try/catch con `ER_DUP_KEYNAME`

**Esempio script tipo:**
```javascript
async function safeAddColumn(conn, table, col, type) {
  const [existing] = await conn.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [col]);
  if (existing.length === 0) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
}
```

**Motivazione:** durante debug capita di rilanciare script. Se rompe alla seconda esecuzione, ostacola lo sviluppo.

### 27. Sincronizzazione obbligatoria schema.ts + storage.ts + routes.ts

Aggiunta dopo F1-026, F1-028 (15/05/2026) — drop di campi su Drizzle senza fixare storage.ts/routes.ts causa runtime errors.

**Regola:**
Quando AG modifica `shared/schema.ts` (aggiungere/rimuovere/rinominare campi/tabelle), DEVE controllare e sincronizzare anche:

1. **`server/storage.ts`** — funzioni che fanno `db.select().from(table)` o `db.insert(table).values({...})`. Se campo droppato e ancora referenziato in `.select({col: table.col})` o `.values({col: ...})` → fix obbligatorio.

2. **`server/routes.ts`** (e split moduli `server/routes/*.ts`) — endpoint che leggono/scrivono il campo. Se ritornavano `member.bio` ma `bio` droppato → fix response shape.

3. **`client/src/...`** — componenti che leggono il campo. Se cambiava nome (es. `nationality` → `citizenship` + nuovo `nationality`), aggiornare interfacce TS, JSX, alias dictionaries.

4. **Frontmatter `_GAE_SVILUPPO/_ANTIGRAVITY/01_status_continui/D_*_Mappa_Dati_e_Frontend_BACKEND.md`** — documentazione struttura DB, da aggiornare.

**Eccezione**: campi `_metadata`, audit log entries pre-esistenti, commenti — non si toccano.

**Motivazione:** Drizzle è solo schema definition. Le query reali stanno in storage.ts/routes.ts. Modificare uno senza l'altro = ER_BAD_FIELD_ERROR a runtime.

### 28. Cleanup file scratch/test/fix dopo task

Aggiunta dopo recap diagnostica Cowork (15/05/2026) — root inquinata da ~80 file scratch_/fix_/test_ accumulati.

**Regola:**
Al termine di ogni task AG, prima di chiudere Stop & Go, AG OBBLIGATORIAMENTE rimuove o sposta i file temporanei creati durante l'esecuzione:

**File da eliminare** (one-shot già usati):
- `scratch_*.ts`, `scratch.ts`, `scratch.tsx`
- `fix_*.cjs`, `fix_*.ts` (script una tantum di fix)
- `patch_*.cjs`
- `test_*.cjs`, `test_*.ts` (a meno che siano test reali in `tests/` o `__tests__/`)
- `update_f*.cjs`, `update_schema.cjs`

**File da spostare in `scripts/_archive/<task_id>/`:**
- Script di migration una-tantum già applicati (es. `run-migration-F1-026.cjs`)
- Audit/diff script che potrebbero servire come reference

**File da mantenere:**
- Test reali in cartelle dedicate (`server/tests/`, `client/tests/`, `tests/`)
- Script di manutenzione ricorrente (es. cron, backup, healthcheck)
- File con prefisso permanente (no `scratch_`, `fix_`, `temp_`)

**Motivazione:** root pulita = onboarding facile + repo professionale. Anche AG fatica con file mischiati durante grep.

---

### 29. Full-width responsive obbligatorio su TUTTE le pagine

Aggiunta dopo richiesta UX di Gaetano (15/05/2026) — diverse pagine hanno `max-w-screen-xl/lg/md` arbitrari che lasciano fasce vuote ai lati su schermi >1400px.

**Regola:**
Ogni pagina del gestionale DEVE adattarsi all'ampiezza totale della finestra. Layout standard:

```tsx
// CORRETTO
<div className="w-full px-6 py-4">
  <header>...</header>
  <main className="w-full">...</main>
</div>

// VIETATO (cap fissi che lasciano spazio vuoto)
<div className="max-w-screen-xl mx-auto">...</div>
<div className="max-w-7xl">...</div>
<div className="container mx-auto">...</div>  // tailwind 'container' ha cap
```

**Eccezioni esplicite (UNICHE consentite):**
- Form a colonna singola di input (max 720px per leggibilità)
- Modali e dialog (Radix dialog ha sua larghezza)
- Login/onboarding screen (centratura intenzionale)

**Pattern globale:**
- `AppLayout` (wrapper di livello pagina) → `w-full min-h-screen px-6 py-4`
- Content area → `w-full` (mai max-width restrittivi)
- Tabelle → scrollable orizzontalmente solo se overflow reale, mai cap di larghezza

**Verifica:** prima di chiudere task FE che tocca layout, AG fa screenshot a 1920px e 1440px → la content area DEVE riempire 100% del viewport (meno sidebar).

**Motivazione:** browser desktop moderni hanno schermi 1440-2560px. Pagine cappate sembrano "vecchie" e sprecano spazio prezioso per tabelle dati e dashboard.

---

### 30. Eliminazione UI = screenshot prima/dopo obbligatorio

Aggiunta dopo richiesta esplicita di Gaetano (15/05/2026) — quando rimuoviamo input/sezioni/feature UI, Gaetano deve poter validare visivamente prima del commit.

**Regola:**
Quando un task elimina elementi UI visibili (campi input, bottoni, sezioni, tab, pagine), AG OBBLIGATORIAMENTE produce:

1. Screenshot **prima** della modifica (stato attuale UI con elementi presenti)
2. Screenshot **dopo** la modifica (stato risultante UI con elementi rimossi)
3. Allegare entrambi al report Stop & Go in `_GAE_SVILUPPO/_ANTIGRAVITY/02_output_protocolli/`

**Quando si applica:**
- DROP campi UI (es. F2-021 rimozione 32 input obsoleti TabAnagrafica)
- Rimozione tab/sezioni intere
- Dismissione pagine vecchie
- Refactor che cambia significativamente layout pagina

**Quando NON si applica:**
- Refactor interno senza cambio visivo
- Aggiunta nuovi elementi (basta screenshot finale)
- Modifiche stilistiche minori (colori, padding piccolo)

**Motivazione:** Gaetano è product owner e vuole sempre validare visivamente cosa scompare dall'UI. Eliminazioni a freddo senza prova grafica generano sorprese sgradite.

---

### 31. Maschera classica anagrafica NON va eliminata (policy)

Aggiunta dopo richiesta esplicita di Gaetano (15/05/2026) — la nuova Pratica Guidata (Wizard) NON sostituisce la maschera classica `maschera-input-generale.tsx`.

**Policy:**
- La maschera classica resta accessibile e funzionale
- Banner attivo "Stai usando la maschera classica. Dal 28/05/2026 la Pratica Guidata sarà l'unico flusso." → resta visibile
- Dal 28/05/2026 la maschera classica diventa **read-only / consultazione**, ma non viene rimossa dal codice fino a esplicita decisione Gaetano
- Tutte le modifiche dati dopo 28/05 passano dal Wizard

**Motivazione:** transizione graduale, non disruptive. La maschera classica è punto di riferimento visivo storico, gli operatori segreteria hanno memoria muscolare. Eliminazione = trauma operativo evitabile.

**Eccezioni alla policy:** nessuna senza approvazione esplicita Gaetano in chat.

---

## 📋 Le 27 chat del progetto

Per riferimento, l'elenco completo delle chat moduli:

```
01_quote_e_promozioni        15_Saggi
02_GemStaff                  16_VacanzeStudio
03_GemTeam                   17_Clarissa
04_MedGem                    18_GemEvent
05_GemPass                   19_GemNight
06_contabilita               20_MerchSG
07_Gemory                    21_TeoCopilot
08_corsi                     22_Import_Export_dati
09_workshop                  23_Log_per_verifiche
10_utenti_GemPortal          24_DB_Monitor
11_Campus                    25_Knowledge_Base
12_Gemdario                  26_Dashboard
13_Domeniche_in_Movimento    27_TV_e_pubblicita
14_BookGem
```

Più la **Chat di Analisi** (senza numero) che è il coordinamento globale.
