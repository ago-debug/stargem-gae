---
tags: [regole, filesystem]
aggiornato: 2026-04-28
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
