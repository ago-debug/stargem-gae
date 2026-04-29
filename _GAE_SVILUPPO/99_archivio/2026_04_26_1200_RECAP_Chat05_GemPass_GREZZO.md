# RECAP — Chat_05_GemPass
## Aggiornato: 2026_04_26_1800
## (include novità da Chat_22b Bonifica)

---

## LEGGI PRIMA DI TUTTO

Nella nuova chat, la prima cosa da fare è:
```
Leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- D2_2026_04_25_1215_Stato_Mappa_Frontend.md
- 2026_04_25_1215_ANALISI_MASTER.md
```

---

## CONTESTO MODULO

GemPass gestisce le tessere associative dei members.
Memberships: 3.305 record (3.281 originali + 24 da bonifica).
Stagioni: season_id 1=25/26 · 2=26/27 · 3=24/25
Formato tessera: 2526-000042 (con trattino) — NON modificare.

---

## STATO ATTUALE — cosa funziona

```
✅ Tessere importate: 3.281 record originali
✅ +24 tessere create da bonifica (data_quality_flag=da_verificare)
✅ Backfill season_competence=2526 (2.218 record)
✅ Formato numero tessera corretto (2526-000042)
✅ API pubblica /api/public/membership-status/:code
✅ ExportWizard con strong typing (date, booleani)
✅ sanitizer.ts attivo su tutti i salvataggi
✅ TZ=Europe/Rome su VPS
✅ Badge CF MANCANTE attivo in UI (members.tsx,
   anagrafica-home.tsx, gempass.tsx)
```

---

## NOVITÀ DA CHAT_22b BONIFICA — importanti

```
8 MEMBRI SENZA CF — NON possono ricevere tessera:
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
  → Completare CF in anagrafica prima di procedere

24 TESSERE CREATE DA BONIFICA:
  data_quality_flag = 'da_verificare'
  membership_type = 'ENDAS' (default, verificare)
  Queste tessere vanno revisionate dalla segreteria
```

---

## COSA NON FUNZIONA — da sistemare

### Bug UI — campi che mostrano "—"
```
membership_type → Tipo ente (ENDAS/OPES/LIBERTAS)
issue_date      → Data emissione tessera
season_id       → Stagione
fee             → Quota tessera pagata
```

### Funzionalità da creare
```
DA CREARE: tabella membership_events
  Storico: emissione, rinnovo, sospensione,
  riattivazione
  Campi: id, membership_id, event_type,
         event_date, notes, operator_id

DA CREARE: bottone "Dati da verificare"
  Filtra: data_quality_flag = 'da_verificare'
  (include le 24 tessere da bonifica)
  o data_quality_flag = 'tessera_mancante_da_assegnare'

DA CREARE: funzione "Assegna Tessera"
  Per member senza tessera — assegnazione rapida

PENDENTE: firma kiosk tablet (Phase 2)
```

### Badge qualità da mostrare
```
data_quality_flag in members:
  mancano_dati_obbligatori → 🔴 CF MANCANTE
  tessera_mancante_da_assegnare → 🟡 giallo
  omonimo_da_verificare → 🔴 rosso
  da_verificare → 🟠 arancio (tessere bonifica)
  incompleto → ⚪ grigio
```

---

## REGOLE OPERATIVE

```
F1 = AG-Backend (Finestra 1)
F2 = AG-Frontend (Finestra 2)
Protocolli: F1-001 / F2-001 (riparte da zero)

Flusso obbligatorio:
1. Claude chiede ad Antigravity di analizzare
2. Antigravity risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive sempre Antigravity

Ogni risposta di Antigravity indica il numero
del protocollo: "Risposta F1-PROTOCOLLO-001"

Ogni protocollo in un unico blocco testo
pronto per copia-incolla.

Stop & Go prima di modificare DB.
Backup dopo ogni F1 su DB.
MAI DROP — solo ADD COLUMN.
Deploy: git push → stop.
Gaetano deploya manualmente su Plesk.
```

---

## INFO DB

```
Tabella: memberships (3.305 record)
  Campi chiave: id, member_id, membership_number,
    membership_type, status, issue_date, expiry_date,
    season_id, fee, is_renewal, renewed_from_id,
    previous_membership_number, notes, data_quality_flag
  Vincolo unicità: member_id + season_id

Tabella: seasons
  1 = stagione 25/26
  2 = stagione 26/27
  3 = stagione 24/25

Tabella: members (174 colonne, 4.342 record)
  data_quality_flag → usato per badge qualità
  CF: 8 membri con fiscal_code = NULL
      (flag = mancano_dati_obbligatori)

CF Validator: shared/utils/cf-validator.ts
  Algoritmo italiano checksum attivo
  Usato in import — disponibile per validazione
  real-time in Chat_10_Utenti
```

---

## COME APRIRE LA NUOVA CHAT

```
Sei Claude coordinatore del progetto StarGem Suite.
Questa è Chat_05_GemPass.

PRIMA DI TUTTO leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- 2026_04_26_1800_RECAP_Chat05_GemPass.md

OBIETTIVO: sistemare i bug UI di GemPass
(campi che mostrano "—") e creare le
funzionalità mancanti (membership_events,
Assegna Tessera, Dati da verificare,
badge qualità).

ATTENZIONE: 8 membri senza CF hanno già
il badge CRITICO attivo in UI. Non rimuoverlo.
Le 24 tessere create da bonifica hanno
data_quality_flag=da_verificare — vanno
revisionate dalla segreteria.

Dev: localhost:5001
DB: stargem_v2 porta 3307 (tunnel locale)
```
