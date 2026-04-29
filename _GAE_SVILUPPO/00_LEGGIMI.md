# 📂 GAE_SVILUPPO — Cartella di scambio StarGem Suite

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
