# RECAP CHIUSURA — Chat_05_GemPass
## Aggiornato: 2026_05_05
## Stato: 🟡 In corso — F1-001 emesso, non ancora eseguito
## Questa chat viene eliminata. Il RECAP è la fonte di verità per la prossima sessione.

---

## FILE DA LEGGERE ALL'APERTURA DELLA NUOVA CHAT

```
Leggi dal Progetto Claude (o dalla cartella):
- 2026_04_26_1800_MASTER_STATUS.md       ← stato globale progetto
- D_2026_04_25_1215_Stato_DB_Reale.md   ← struttura DB reale
- D2_2026_04_25_1215_Stato_Mappa_Frontend.md  ← mappa frontend
- 2026_04_25_1215_ANALISI_MASTER.md     ← analisi trasversale
- questo file                            ← storia di questa chat
```

---

## CONTESTO MODULO

GemPass gestisce le tessere associative dei members (tabella `memberships`).
Memberships: 3.305 record (3.281 importati + 24 creati da bonifica Chat_22b).
Stagioni: season_id 1=25/26 · 2=26/27 · 3=24/25
Formato tessera: 2526-000042 (con trattino) — NON modificare mai.

---

## STATO ATTUALE — cosa funziona

```
✅ Tessere importate: 3.281 record originali (Chat_22)
✅ +24 tessere create da bonifica (data_quality_flag=da_verificare)
✅ Backfill season_competence=2526 (2.218 record)
✅ Formato numero tessera corretto (2526-000042)
✅ API pubblica /api/public/membership-status/:code attiva
✅ ExportWizard con strong typing (date, booleani) — da Chat_22b
✅ sanitizer.ts attivo su tutti i salvataggi — da Chat_22b
✅ TZ=Europe/Rome su VPS — da Chat_22b
✅ Badge "CF MANCANTE" attivo in UI su 8 membri
   (files: members.tsx, anagrafica-home.tsx, gempass.tsx)
✅ Campi memberships già nel DB:
   id · member_id · membership_number · membership_type
   status · issue_date · expiry_date · season_id · fee
   is_renewal · renewed_from_id · previous_membership_number
   notes · data_quality_flag
```

---

## COSA NON FUNZIONA — da sistemare nella prossima sessione

### Bug UI priorità 1-3: campi nel DB ma che mostrano "—" in UI

| Campo DB          | Colonna UI       | Valore reale nel DB        |
|-------------------|------------------|----------------------------|
| membership_type   | Tipo ente        | ENDAS · OPES · LIBERTAS    |
| issue_date        | Data emissione   | data tessera               |
| season_id         | Stagione         | 1=25/26 · 3=24/25          |
| fee               | Quota            | quota pagata               |

Causa probabile: la route GET /api/memberships non espone questi campi nel JSON,
oppure il frontend gempass.tsx non li legge dalla risposta.
F1-001 doveva verificarlo — vedi sezione PROTOCOLLI.

### Funzionalità da creare (priorità 4-6)

```
PRIORITÀ 4 — Bottone "Dati da verificare"
  Filtra memberships con data_quality_flag IN:
    ('da_verificare', 'tessera_mancante_da_assegnare')
  Counter da mostrare nel bottone:
    1.322 tessere con tessera_mancante_da_assegnare
    +24 tessere con da_verificare (da bonifica)
  Pattern UI: come "Visualizza Duplicati" già presente in Anagrafica

PRIORITÀ 5 — Funzione "Assegna Tessera" rapida
  Per i member con data_quality_flag = tessera_mancante_da_assegnare
  Permette assegnazione rapida da UI senza aprire scheda completa
  Campo da aggiungere a memberships: tessera_mancante_da_assegnare (booleano)
  → ADD COLUMN solo, mai DROP

PRIORITÀ 6 — Tabella membership_events (storico azioni tessera)
  Campi: id, membership_id, event_type, event_date, notes, operator_id
  Tipi evento: emissione · rinnovo · sospensione · riattivazione · ristampa · smarrita
  Usata per audit trail ogni modifica sulla tessera

FASE 2 (bassa priorità, non blocca):
  firma kiosk tablet
```

### Badge qualità da mostrare in GemPass

```
data_quality_flag in members:
  mancano_dati_obbligatori → 🔴 "CF MANCANTE" (già attivo in UI)
  tessera_mancante_da_assegnare → 🟡 giallo (da aggiungere)
  omonimo_da_verificare → 🔴 rosso (da aggiungere)
  da_verificare → 🟠 arancio (da aggiungere — 24 tessere bonifica)
  incompleto → ⚪ grigio (da aggiungere)
```

---

## NOVITÀ DA CHAT_22b BONIFICA — da non perdere

```
8 MEMBRI SENZA CODICE FISCALE:
  BELLONI HELLEN
  BOCCHETTI MALTSEVA EKATERINA
  BURANI SARA
  CIONI BIANCA
  GIACOSA CHIARA
  GULIZIA GABRIELE
  MONTANI FRANCESCA
  MOUTIQ JAMILIA

Questi 8 hanno:
  data_quality_flag = 'mancano_dati_obbligatori'
  Badge rosso "CF MANCANTE" visibile in UI
  Bottone GemPass disabilitato con tooltip
  → Completare CF in Anagrafica prima di procedere

24 TESSERE CREATE DA BONIFICA:
  data_quality_flag = 'da_verificare'
  membership_type = 'ENDAS' (default — va verificato)
  Vanno revisionate dalla segreteria
```

---

## PROTOCOLLI EMESSI IN QUESTA CHAT

### F1-PROTOCOLLO-001 — emesso, NON ancora eseguito

Antigravity NON ha ancora risposto. Nella nuova chat riproporre questo
prompt come prima azione verso AG-F1:

```
F1-PROTOCOLLO-001 — GemPass: audit colonne mute

Antigravity, solo lettura. Tre blocchi:

1. DB stargem_v2 porta 3307:

SHOW COLUMNS FROM memberships;

SELECT id, membership_number, membership_type, season_id, issue_date,
fee, status FROM memberships ORDER BY id DESC LIMIT 5;

SELECT COUNT(*) totale, COUNT(membership_type) con_tipo,
COUNT(season_id) con_season, COUNT(issue_date) con_issue,
COUNT(fee) con_fee, COUNT(membership_number) con_numero
FROM memberships;

2. Backend — route GET /api/memberships:
Trova la route in server/routes.ts e la funzione storage collegata.
Riporta: la query Drizzle usata, i campi selezionati,
i campi inclusi nel JSON di risposta.

3. Frontend — client/src/pages/gempass.tsx:
Riporta solo: quale endpoint chiama, come renderizza
le colonne Tipo / Stagione / Data emissione / Quota.
Cerca membership_type, season_id, issue_date, fee nel JSX della tabella.

STOP. Zero modifiche. Riporta i tre output e aspetta.
```

### Stato protocolli al momento della chiusura

```
F1-001: emesso — NON eseguito
F2-001: non ancora emesso
```

---

## DECISIONI ARCHITETTURALI PRESE (definitive)

```
1. Numero tessera = permanente e immutabile
   → una volta assegnato non si cambia mai

2. Tessera senza numero → flag booleano
   tessera_mancante_da_assegnare su memberships
   → ADD COLUMN solo, mai DROP

3. Tabella membership_events = storico audit tessera
   → da creare (F1 dedicato, non ancora emesso)

4. Bottone "Dati da verificare" in GemPass
   → pattern identico a "Visualizza Duplicati" in Anagrafica

5. Assegna Tessera = funzione rapida da GemPass
   → senza aprire scheda completa del member

6. membership_type contiene ENDAS/OPES/LIBERTAS
   (NON adulto/minore/b2b come nel design originale)
   → la UI deve adattarsi ai valori reali del DB
```

---

## INFO DB COMPLETO

```
Tabella: memberships (3.305 record)
  Campi: id · member_id · membership_number · membership_type
         status · issue_date · expiry_date · season_id · fee
         is_renewal · renewed_from_id · previous_membership_number
         notes · data_quality_flag · season_competence · barcode
  Vincolo unicità: member_id + season_id (un member, una tessera per stagione)
  season_id FK → seasons.id

Tabella: seasons
  id=1 → 25/26
  id=2 → 26/27
  id=3 → 24/25

Tabella: members (174 colonne, 4.342 record)
  data_quality_flag → campo centrale per badge e filtri qualità
  fiscal_code → NULL su 8 membri (vedi sopra)

Tabella: membership_events → DA CREARE

Flag qualità attivi su members (totali):
  tessera_mancante_da_assegnare: 1.322
  omonimo_da_verificare: 407
  mancano_dati_obbligatori: 198
  nome_match: 179
  incompleto: 20
```

---

## REGOLE OPERATIVE — da rispettare nella prossima chat

```
F1 = AG-Backend (Finestra 1)
F2 = AG-Frontend (Finestra 2)
Protocolli: ripartono da F1-001 / F2-001

FLUSSO OBBLIGATORIO:
1. Claude chiede ad Antigravity di analizzare
2. Antigravity risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive SEMPRE Antigravity

Ogni risposta di Antigravity indica il numero
del protocollo: "Risposta F1-PROTOCOLLO-001"

Ogni protocollo = un unico blocco testo copia-incolla.

Stop & Go prima di modificare DB.
Backup obbligatorio dopo ogni F1 che tocca tabelle.
MAI DROP su memberships o payments — solo ADD COLUMN.
Deploy: git push → stop. Gaetano deploya manualmente su Plesk.
```

---

## REGOLE SUI PROMPT AD ANTIGRAVITY

```
Stile: brevi, chiari, definitivi.
Struttura: blocchi numerati, nessuna spiegazione inutile.
Prima azione sempre: solo lettura (audit) → poi VAI.
Intestazione obbligatoria: PER AG-F1 (BACKEND) o PER AG-F2 (FRONTEND).
F1 prima, F2 dopo — mai invertire.
```

---

## INFRASTRUTTURA

```
Dev: localhost:5001
VPS: IONOS 82.165.35.145
DB: stargem_v2 su MariaDB
    port 3306 (VPS) / 3307 (SSH tunnel locale)
App: pm2 porta 5001, nome: stargem
Deploy: git push → Plesk git pull manuale → npm run build → pm2 reload stargem
Backup path: /root/backups/ sul VPS
Ultimo backup: CHAT22B_BONIFICA_OP1235_20260426.sql ✅
Stack: React + TypeScript + Tailwind + React Query (frontend)
       Node.js + Drizzle ORM (backend) · MariaDB 11.4
```

---

## TESTO DI APERTURA NUOVA CHAT

Incolla questo come primo messaggio nella nuova Chat_05:

```
Sei Claude coordinatore del progetto StarGem Suite.
Questa è Chat_05_GemPass — nuova sessione.

PRIMA DI TUTTO leggi:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- 2026_05_05_RECAP_Chat05_GemPass_CHIUSURA.md  ← questo file

OBIETTIVO: sistemare i bug UI di GemPass
(4 campi che mostrano "—" invece del valore)
e creare le funzionalità mancanti.

PRIMA AZIONE: emetti F1-001 verso AG-Backend
per audit route GET /api/memberships e file gempass.tsx.
Il testo del prompt F1-001 è già scritto nel RECAP — usalo.

ATTENZIONE:
- 8 membri con badge CF MANCANTE già attivo — non rimuovere
- 24 tessere bonifica con data_quality_flag=da_verificare
- Numero tessera = immutabile — non toccare logica barcode

Dev: localhost:5001
DB: stargem_v2 porta 3307 (tunnel locale)
```
