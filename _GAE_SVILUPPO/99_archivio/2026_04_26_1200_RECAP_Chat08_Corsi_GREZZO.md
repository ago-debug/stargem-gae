# RECAP — Chat_08_Corsi/Iscritti
## Aggiornato: 2026_04_26_1800

---

## LEGGI PRIMA DI TUTTO
```
Dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- D2_2026_04_25_1215_Stato_Mappa_Frontend.md
```

---

## NOVITÀ DA CHAT_22b/BONIFICA

```
285 SKU riclassificati da 'storico':
  27  → workshop (WS*, NATALE)
  19  → domenica_movimento (KUQI*, RUSSO, DOSSANTO)
  14  → corso (OPEN*, CUGGEGIO, storici)
  4   → campus (CAMPUSS1/S2)
  1   → lezione_individuale (LEZINDIVIDUALE)
  1   → prova_gratuita (LEZPROVA)
  1   → merchandising (MERCHANDISING)
  1   → allenamenti (ALLENAMENTO)
  1   → buono_regalo (GIFT)

3 SKU restano 'storico' — NON TOCCARE:
  2526QUOTATESSERA (contenitore tessere)
  2526DTYURI (contenitore visite mediche)
  2526DTNELLA (contenitore visite mediche)

929 prove: season_id = 1 aggiornato

Smart Routing attivo nell'import:
  Nuovi CSV non creeranno più record
  storico in enrollments per errore.
  QUOTATESSERA → memberships automatico
  DTYURI/DTNELLA → medical_certificates auto

ExportWizard con strong typing attivo.
sanitizer.ts attivo su tutti i salvataggi.
```

---

## PENDENTI

```
1. BADGE STATUS ISCRIZIONE
   enrollments.status → badge colorato:
   active    → verde
   pending   → giallo
   cancelled → rosso
   Attualmente tutti 'active' —
   nessun badge mostrato in UI.

2. UNIFORMARE participation_type
   Coesistono: 'corso' e 'STANDARD_COURSE'
   Scegliere uno e migrare tutti i record.
   Prima audit: quanti record per tipo?
   SELECT participation_type, COUNT(*)
   FROM enrollments
   GROUP BY participation_type;

3. CAMPI NASCOSTI IN UI
   enrollments.source_file → fonte import
   enrollments.notes → note interne
   enrollments.season_id → stagione
   Filtri da aggiungere:
   per stagione, per status, per tipo

4. OPEN* = ABBONAMENTI CORSI
   Gli SKU OPEN* sono stati classificati
   come 'corso' (non come eventi).
   Verificare che appaiano correttamente
   nella sezione corsi con i filtri giusti.
```

---

## REGOLE OPERATIVE
```
F1 = AG-Backend · F2 = AG-Frontend
Protocolli: F1-001 / F2-001

Flusso: audit → analisi → VAI
Ogni risposta indica: "Risposta F1-PROTOCOLLO-001"
Ogni protocollo in un unico blocco copia-incolla.

enrollments → MAI DROP tabella
courses → non toccare struttura STI
Backup obbligatorio prima di ogni F1 su DB.
Deploy: git push → stop, Gaetano deploya su Plesk.
```

---

## COME APRIRE LA CHAT
```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_08_Corsi/Iscritti.

Leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md

PRIORITÀ:
1. Uniformare participation_type
   ('corso' vs 'STANDARD_COURSE')
2. Badge status iscrizione (active/pending/cancelled)
3. Campi nascosti + filtri in UI

ATTENZIONE:
- 3 SKU storico NON toccare:
  QUOTATESSERA, DTYURI, DTNELLA
- Smart Routing attivo nell'import

Dev: localhost:5001
DB: stargem_v2 porta 3307
```
