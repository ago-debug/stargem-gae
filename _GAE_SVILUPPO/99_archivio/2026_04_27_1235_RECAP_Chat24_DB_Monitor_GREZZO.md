# RECAP — Chat_24_DB_Monitor
## Creato: 2026_04_27_1235
## Stato: 🆕 NUOVA CHAT — modulo da costruire

---

## OBIETTIVO

Costruire un cruscotto interno di monitoraggio
del database stargem_v2 visibile solo a Gaetano
(admin/root). Solo lettura — nessuna azione
di modifica al DB. Una mappa costante e dettagliata
con riferimenti chiari per supportare le decisioni
di cleanup e architettura nelle prossime sessioni.

---

## LEGGI PRIMA DI TUTTO
```
Dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- 2026_04_26_1800_CHECKLIST_GLOBALE.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- 2026_04_27_1235_RECAP_Chat24_DB_Monitor.md
```

---

## CONTESTO

```
DB: stargem_v2 (MariaDB 11.4)
Tabelle attuali: 80+
Tabelle "spazzatura" identificate: 13
Tabelle vuote ma agganciate al codice: ~30
Tabella critica: members (174 colonne,
  ALTER bloccato per row size limit 8126 byte)

Ghost column in members:
  street_address (DROP impossibile)

Dopo Chat_22b Bonifica:
  members: 4.342 (8 senza CF flaggati)
  memberships: 3.305 (+24 da bonifica)
  medical_certificates: 2.867 (+97 da bonifica)
  enrollments: 13.584 (929 prove fixed)
  courses: 586 (285 SKU riclassificati)
```

---

## REQUISITI DEL CRUSCOTTO

### Accesso
```
- Visibile SOLO a utenti con role = 'admin' o 'root'
- Voce nel menu sinistra (Admin section)
- Nome proposto: "DB Monitor" o "Mappa Database"
- Solo lettura — nessun pulsante di modifica
- Nessun export verso esterno (sicurezza)
```

### Dati da mostrare per ogni tabella
```
1. Nome tabella
2. Numero righe (refresh real-time o periodico)
3. Lista colonne con:
   - Nome colonna
   - Tipo (VARCHAR(255), INT, TEXT, ecc.)
   - NULL allowed sì/no
   - DEFAULT value
   - Indici (PRIMARY, UNIQUE, INDEX)
4. Foreign Keys:
   - Colonna FK
   - Tabella riferita
   - Comportamento ON DELETE
5. Dimensione tabella su disco
6. Ultimo aggiornamento (created_at / updated_at)
7. È referenziata in schema.ts? (sì/no)
8. È referenziata nel codice? (sì/no)
```

### Funzionalità di navigazione
```
- Filtro per nome tabella
- Filtro per stato (popolata / vuota / orfana)
- Filtro per tipo (utente / sistema / backup)
- Ricerca colonna (cerca "email" → tutte le tabelle
  che hanno una colonna email)
- Vista relazioni FK (grafo o lista)
- Sample data: prime 5 righe di ogni tabella
  (oscurando dati sensibili tipo password/CF)
```

### Indicatori critici
```
🔴 Tabella orfana (non in schema.ts)
🟡 Tabella vuota ma in schema.ts
🟢 Tabella popolata e attiva
⚠️  Tabella backup (nome contiene _backup_)
🚫 Tabella deprecata (ha deprecation flag)
```

---

## REGOLE OPERATIVE

```
F1 = AG-Backend (Finestra 1)
F2 = AG-Frontend (Finestra 2)
Protocolli: F1-001 / F2-001 (parte da zero)

Flusso obbligatorio:
1. Claude chiede ad Antigravity di analizzare
2. Antigravity risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive sempre Antigravity

Ogni risposta indica il protocollo:
"Risposta F1-PROTOCOLLO-001"

Ogni protocollo in un unico blocco
pronto per copia-incolla.

REGOLE SPECIFICHE PER QUESTO MODULO:
- SOLO LETTURA — mai INSERT/UPDATE/DELETE
- Nessuna route che esponga dati sensibili
  (password, hash, token, CF in chiaro)
- Endpoint admin-only protetti da middleware
  che verifica role
- Nessun deploy automatico — manuale Plesk
```

---

## STRATEGIA DI APPROCCIO

```
F1-001 (audit):
  Claude chiede ad Antigravity di:
  - Esplorare se esistono già route admin
    per introspection del DB
  - Verificare quale middleware è disponibile
    per restrizione admin-only
  - Proporre architettura backend del modulo
    (route, query INFORMATION_SCHEMA,
     caching per performance)
  - Stimare quanti endpoint serviranno

F2-001 (audit):
  Claude chiede ad Antigravity di:
  - Esplorare il sistema di routing menu
    sinistra esistente
  - Verificare se c'è già una sezione "Admin"
    o va creata
  - Proporre layout della pagina
    (tabella espandibile? grid? tab?)
  - Stimare componenti UI necessari

Solo dopo queste analisi decidiamo
con Gaetano come procedere.
```

---

## DOMANDE APERTE PER LA CHAT

```
1. Refresh dei dati: real-time (ogni X secondi)
   o on-demand (pulsante refresh)?

2. Storico modifiche: il cruscotto deve
   mostrare la storia delle modifiche
   (es. "ieri questa tabella aveva N righe")?

3. Alert automatici: il cruscotto deve
   notificarti quando una tabella supera
   una soglia (es. logs > 10.000 righe)?

4. Vista sample data: vuoi vedere le prime 5
   righe di ogni tabella nel cruscotto?
   (con privacy mask sui campi sensibili)

5. Esportazione: ti serve esportare la mappa
   come PDF/CSV per riferimento offline?
```

---

## DOPO IL CRUSCOTTO

```
Una volta che il cruscotto è funzionante,
useremo I DATI CHE MOSTRA per decidere:

FASE A — 13 tabelle spazzatura (DROP sicuro)
FASE B — 30 tabelle vuote agganciate al codice
         (decidere caso per caso: mantenere
          o dismettere anche dal codice)
FASE C — Architettura members
         (174 colonne → conversione VARCHAR→TEXT
          per sbloccare DROP COLUMN futuri)

Ognuna di queste fasi sarà una sessione
separata o continuata in questa chat
secondo necessità.
```

---

## COME APRIRE LA CHAT

```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_24_DB_Monitor — NUOVA.

Leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- 2026_04_26_1800_CHECKLIST_GLOBALE.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- 2026_04_27_1235_RECAP_Chat24_DB_Monitor.md

OBIETTIVO:
Costruire cruscotto monitor DB stargem_v2
solo lettura, accesso admin/root, voce
nel menu sinistra. Mappa dettagliata di
tutte le tabelle con colonne, FK, indici,
righe, indicatori di stato.

PRIMA COSA:
Emetti F1-001 e F2-001 di audit (analisi
e proposta), non implementare nulla
finché Gaetano non valuta l'approccio.

REGOLE:
- F1 = AG-Backend · F2 = AG-Frontend
- Solo lettura — mai INSERT/UPDATE/DELETE
- Admin-only — middleware obbligatorio
- Nessun dato sensibile esposto
- Stop & Go prima di qualsiasi codice
- Deploy manuale Plesk

Dev: localhost:5001
DB: stargem_v2 porta 3307 (tunnel locale)
```
