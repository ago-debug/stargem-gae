# RECAP_13_DomenikeInMovimento
> Chat: 13_DomenikeInMovimento
> Creato: 05/05/2026
> Stato: 🔴 Da iniziare — F1-001 emesso ma non ancora eseguito

---

## 1. IDENTITÀ CHAT

| Campo | Valore |
|---|---|
| Numero chat | 13 |
| Nome | DomenikeInMovimento |
| Tema | Gestione eventi domenicali con vendita posti, lista iscritti, prezzi domenicali, integrazione calendario e planning |
| Colore attività | `#a16207` (DOM) |
| activity_type STI | `'domeniche'` |
| Stato | 🔴 Da iniziare |
| Ultimo protocollo F1 | F1-001 (emesso, non ancora eseguito) |
| Ultimo protocollo F2 | nessuno |

---

## 2. CONTESTO ARCHITETTURALE

### Cosa esiste già nel DB
- La colonna `activity_type` in `courses` prevede già il valore `'domeniche'` (STI unificato)
- La vecchia tabella `sunday_activities` + `sa_enrollments` è **marcata DEPRECATA** in `schema.ts` ma potrebbe esistere fisicamente nel DB (da verificare con F1-001)
- `enrollments` è la tabella unificata STI per tutte le iscrizioni
- Il colore `#a16207` è già registrato nel MASTER_STATUS per Domeniche

### Cosa esiste già nel Frontend
- `sunday-activities.tsx` esiste come pagina, usa `ActivityManagementPage` con `activityType='domeniche'`
- `CourseUnifiedModal` già gestisce il titolo dinamico "Domenica" tramite mapping `activityType`
- La prop `activityType` viene passata esplicitamente per garantire continuità tecnica e salvataggio type-safe nel backend

### Referenze architetturali da documenti di progetto
- `02_Frontend_UI_e_Routing.md` — conferma che `sunday-activities.tsx` passa `activityType='domeniche'` a `ActivityManagementPage`
- `00A_GAE_ULTIMI_AGGIORNAMENTI.md` — conferma deprecazione `sunday_activities` e migrazione STI completata per campus; domeniche seguono lo stesso pattern
- `01_Architettura_e_Database_Core.md` — lista le Attività Domenicali (`sunday_activities`, `sa_enrollments`) come DEPRECATO (silo 6 degli 11 silos storici)

---

## 3. OBIETTIVO MODULO

Costruire la **Scheda Domenica** completa con:

1. **Lista eventi domenicali** — card per ogni domenica della stagione
2. **Vendita posti** — capienza massima + posti venduti/disponibili in tempo reale
3. **Lista iscritti per domenica** — chi ha acquistato il posto per quella data
4. **Prezzi domenicali** — quota ingresso singola (diversa dal corso mensile)
5. **Integrazione calendario** — domeniche visibili con colore `#a16207`
6. **Integrazione planning stagionale** — blocchi domenica nel planning annuale

---

## 4. PIANO A 5 FASI (definito in sessione)

### Fase 1 — Audit DB (F1-001)
Fotografare lo stato reale: quante domeniche in `courses`, stato fisico `sunday_activities`, enrollments associati, custom_lists domeniche.

### Fase 2 — Architettura dati
Decidere se i campi extra (posti disponibili, quota ingresso, tipologia domenica) stanno in `courses` con colonne esistenti o richiedono una extension table `domeniche_config`.

### Fase 3 — Backend API (F1-002+)
Endpoint dedicati `/api/domeniche` con filtro STI, endpoint iscrizione singola domenica con controllo capienza.

### Fase 4 — Frontend Scheda (F2-001+)
Pagina `/domeniche` con lista eventi + scheda dettaglio per singola domenica (posti venduti/disponibili, lista iscritti, quota).

### Fase 5 — Integrazione calendario e planning
Domeniche visibili nel calendario con colore `#a16207` e nel planning stagionale.

---

## 5. PROTOCOLLI EMESSI

### F1-PROTOCOLLO-001 — AUDIT DB (⚠️ EMESSO — NON ANCORA ESEGUITO)

```
Sei AG-Backend nel progetto StarGem Suite (MariaDB 11.4, DB: stargem_v2, 
tunnel SSH porta 3307). Questa è la chat "Domeniche in Movimento".
Protocollo: F1-PROTOCOLLO-001.

STOP & GO — solo SELECT e SHOW, zero modifiche.
Esegui queste query diagnostiche e riportami tutti i risultati:

-- 1. Quante domeniche esistono in courses (STI)?
SELECT COUNT(*) as totale_domeniche, 
       MIN(start_date) as prima, 
       MAX(start_date) as ultima
FROM courses 
WHERE activity_type = 'domeniche';

-- 2. Dettaglio domeniche esistenti (max 20)
SELECT id, name, activity_type, start_date, end_date, 
       price, max_participants, season_id, status
FROM courses 
WHERE activity_type = 'domeniche'
ORDER BY start_date DESC
LIMIT 20;

-- 3. Iscrizioni collegate alle domeniche
SELECT COUNT(*) as totale_iscrizioni_domeniche
FROM enrollments e
JOIN courses c ON e.course_id = c.id
WHERE c.activity_type = 'domeniche';

-- 4. La vecchia tabella sunday_activities esiste ancora fisicamente?
SHOW TABLES LIKE 'sunday%';
SHOW TABLES LIKE 'sa_%';

-- 5. Se sunday_activities esiste, quanti record ha?
-- (esegui solo se il punto 4 ha risultati)
SELECT COUNT(*) FROM sunday_activities;

-- 6. Colonne attuali di courses rilevanti per domeniche
SHOW COLUMNS FROM courses;

-- 7. Esistono custom_lists per le domeniche?
SELECT id, name, list_type FROM custom_lists 
WHERE name LIKE '%domenich%' OR name LIKE '%domenica%' OR name LIKE '%sunday%';

Riporta TUTTI i risultati prima di procedere. Non modificare nulla.
```

---

## 6. DECISIONI PRESE IN SESSIONE

| # | Decisione | Motivazione |
|---|---|---|
| D1 | Usare STI su `courses` (non una tabella separata `domeniche`) | Coerenza con architettura unificata già consolidata |
| D2 | activity_type = `'domeniche'` come discriminatore STI | Già previsto nell'enum e nel frontend |
| D3 | `enrollments` come tabella iscrizioni unificata | Nessuna tabella `sa_enrollments` da ricreare |
| D4 | Colore `#a16207` per domeniche in calendario e planning | Già definito nel MASTER_STATUS |

---

## 7. DOMANDE APERTE (da risolvere dopo F1-001)

- Quante domeniche esistono già in `courses`? Hanno `max_participants` compilato?
- La tabella `sunday_activities` esiste ancora fisicamente o è già stata droppata?
- Servono campi extra che `courses` non ha (es. tipologia domenica: laboratorio / stage / gita)?
- Il prezzo domenicale va in `courses.price` oppure in una pricing table separata (es. `price_matrix`)?
- Le domeniche hanno un istruttore fisso o lista di istruttori multipli?

---

## 8. CHAT CORRELATE DA LEGGERE

| Chat | Perché |
|---|---|
| 08_Corsi | Pattern scheda corso — base identica per scheda domenica |
| 09_Workshop | Pattern iscrizioni evento singolo — logica simile |
| 01_Quote&Promo | Se si vuole pricing domenicale da `price_matrix` |
| 12_Gemdario | Integrazione calendario — domeniche nel Gemdario |
| 26_Dashboard | Planning stagionale — blocchi DOM nel planning annuale |

---

## 9. TEMPLATE MASTER_STATUS (da incollare a fine sessione)

```
## 13_DomenikeInMovimento — aggiornato 05/05/2026
Stato: 🔴 Da iniziare
Ultimo protocollo: F1-001 (emesso, non eseguito) / F2-nessuno
Tabelle DB toccate: nessuna
Pendenti: eseguire F1-001 audit · attendere risultati · definire architettura dati · avviare F2-001
```

---

## 10. NOTE OPERATIVE

- **REGOLA DEPLOY:** mai `pm2 restart` o SSH da Antigravity — solo `git push origin main`, poi Gaetano pubblica da Plesk
- **REGOLA STOP & GO:** F1-001 è solo lettura, zero modifiche — approvazione VAI necessaria per ogni successivo protocollo che tocca il DB
- **REGOLA PROTOCOLLI:** F2-001 parte solo dopo aver ricevuto la risposta di F1-001 e aver preso le decisioni architetturali
- **Backup:** obbligatorio dopo ogni F1 che modifica il DB — nessuna modifica ancora fatta in questa chat

---

*Fine RECAP — Chat 13_DomenikeInMovimento — generato il 05/05/2026*
