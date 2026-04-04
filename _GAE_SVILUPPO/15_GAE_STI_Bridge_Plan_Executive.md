# 18 GAE: STI Bridge Plan Executive (001_AG_STI_BRIDGE_PLAN)

Questo documento traccia il piano esecutivo intermedio per la transizione alla Single Table Inheritance (STI) delle attività. La fase attuale è PURAMENTE di design e non altera i dati esistenti.

## 1. Schema Esecutivo Proposto

### A. `activities_unified`
- `id`: serial primary key
- `legacy_source_type`: varchar(50) (es. 'courses', 'workshops', 'rentals', 'saggi', 'campus')
- `legacy_source_id`: int (L'ID originale nel silo di partenza, es. courses.id)
- `activity_family`: varchar(50) (Macrocategoria: 'didattica', 'evento', 'servizio')
- `activity_type`: varchar(50) (Il tipo esatto legacy)
- `title`: varchar(255) not null
- `subtitle`: varchar(255) null
- `description`: text
- `season_id`: int references seasons(id)
- `start_datetime`: timestamp null (Per eventi puntuali)
- `end_datetime`: timestamp null
- `recurrence_type`: varchar(50) null ('weekly', 'custom', 'none')
- `instructor_id`: int references members(id) null
- `studio_id`: int references studios(id) null
- `max_participants`: int
- `base_price`: decimal(10,2) null
- `status`: varchar(50) default 'active'
- `visibility`: varchar(50) default 'public'
- `extra_config_json`: jsonb (Payload per contenere orari ricorrenti, sku, categorie extra)
- `created_at`: timestamp
- `updated_at`: timestamp

### B. `enrollments_unified`
- `id`: serial primary key
- `member_id`: int references members(id)
- `activity_unified_id`: int references activities_unified(id)
- `participation_type`: varchar(50) ('STANDARD', 'FREE_TRIAL', 'PAID_TRIAL', 'SINGLE_LESSON')
- `target_date`: timestamp null (Data mirata dell'iscrizione)
- `payment_status`: varchar(50) null ('paid', 'pending', 'free')
- `notes`: text
- `season_id`: int references seasons(id)
- `created_at`: timestamp
- `updated_at`: timestamp

## 2. Tabella di Mapping Legacy -> Unified

| Tabella Legacy | Tipo Attività | Campi Equivalenti -> Unified | Campi Mancanti in Legacy | Problemi di Mapping |
| --- | --- | --- | --- | --- |
| `courses` | courses | name->title, description->description, instructorId->instructor_id | recurrence_type, end_datetime | Ripetizioni hardcodate su `dayOfWeek` e stringhe d'orario, serve parser verso extra_config_json. |
| `workshops` | workshops | name->title, date+time->start_datetime, price->base_price | end_datetime (spesso assente) | Merge date+time in timestamp; gestione multi-giorno su JSON. |
| `rentals` | rentals | contactName->subtitle, status->status | instructor_id (irrilevante), participation_type (diverso dal corso) | Concept differente, la stanza è l'entità, affittuario è member_id. |
| `campus` | campus | name->title, startDate->start_datetime | max_participants, base_price | Prezzo solitamente in `campus_installments`. |
| `sunday_activities` | eventi | name->title, eventDate->start_datetime | extra_config_json necessario per dati ancillari | Spesso entità destrutturata. |
| `recitals` (Saggi) | saggi | title->title, showDate->start_datetime | | Attività con rami ticket/botteghino non presenti in unified_activities. |

*Note su Compatibilità:* Il campo `legacy_source_type` + `legacy_source_id` garantisce sempre di poter rintracciare il record nativo in caso di incongruenze, permettendo al layer Bridge di idratare le vecchie foreign keys.

## 3. Piano Bridge (Il Layer Parallelo)

L'obiettivo del Bridge è "far finta" che il sistema STI sia già vivo in sola lettura per chi ne ha bisogno.
- **Service/Mapper**: Sarà creata una utility Node (`server/services/unifiedBridge.ts`) che agirà in lettura (GET). Interrogherà in parallelo (Promise.all) i vecchi silos, formatterà al volo la riposta incapsulando il formato `activities_unified` ed emitendola al frontend.
- **Transizione Moduli**: Calendario e Planning smetteranno di fare mix-and-match nel web-browser e chiameranno UNA SOLA rotta Bridge API. Il frontend non si spaccherà perché riceverà payload normalizzato e tipizzato esattamente come prescritto dallo schema GAE.

## 4. Compatibilità API (Endpoint Bridge)

| Endpoint Bridge | Azione | Modulo Client Target | Note di Transizione |
| --- | --- | --- | --- |
| `GET /api/activities-unified-preview` | Aggrega `courses`, `workshops`, ecc. trasmutandoli nel formato STI in RAM. | Calendario, Planning | Il FE smette di fetchare N endpoints individualmente. |
| `GET /api/activities-unified-preview/:type/:id`| Ritorna un'attività precisa, decodificando `legacy_source_type`. | Modali Dettaglio (Futuro) | |
| `GET /api/enrollments-unified-preview` | Unisce `enrollments` e tabelle iscrizioni esterne. | Modale Pagamenti (selettore) | |

Gli endpoint preesistenti (`GET /api/courses`, `POST /api/workshops`) rimarranno **attivi e legacy** per permettere al backend ed alle schermate CMS dedicate di lavorare fluidamente senza rotture prima dello shadow-mode db.

## 5. Matrice dei Rischi

| Rischio | Gravità | Probabilità | Mitigazione |
| --- | --- | --- | --- |
| Incoerenza Stagioni | Alta | Media | Usare fallback esplicito su `activeSeason` del server quando legacy_source ne è sprovvisto. |
| Incoerenza Prezzi | Alta | Bassa | Estrapolazione del `base_price` legacy e affidamento della risoluzione esatta al Listino/PeriodId al momento del checkout (esattamente come ora in Modale Pagamenti). |
| Problemi Calendario | Media | Alta | Test rendering visuale della nuova API bridge con sub-browser e comparazione A/B a schermo nascosto prima di rimuovere vecchie API. |
| Doppioni Dati (ID Clash) | Critica | Alta | Usare string composition provvisoria nel Bridge (es. `id = "course_12"`) poi convertita in ID univoco intero nella Fase 2 (Migrazione shadow) |
| Rottura Pagamenti | Critica | Bassa | Modale pagamenti continuerà a puntare *temporaneamente* via DTO al silo corretto risolvendo dal prefisso `legacy_source_type`. |

## 6. Roadmap Fasi Esecutive (Stato Attuale)

- **Fase 1 (Completata)**: Design + mapping + bridge plan.
- **Fase 2 (Completata)**: Creazione tabelle shadow `activities_unified` ed `enrollments_unified` in database (Strictly permissivo, no FK hard, no CASCADE).
- **Fase 3 (Completata)**: Bridge API in lettura (`unifiedBridge.ts`) testato su `GET /api/activities-unified-preview`.
- **Fase 4 (Completata)**: Calendar Read Switch. Il Calendario frontend è collegato al layer Bridge.
- **Fase 5 (Completata con UI Freeze REVOCATO)**: Trasformazione Data-Aware con *Recurrence Engine* settimanale funzionante sui Corsi (-30/+60 gg).
- **Fase 6 (Completata)**: Risoluzione campi relazionali per alimentare la scheda Calendario e validazione visiva (tutte le anagrafiche sono agganciate). Il calendario è multi-stagione e operativo.
- **Fase 7 (Inizianda / PROSSIMO STEP)**: Modifica allo Schema (`schema.ts`) per formalizzare la STI, generazione Drizzle Migration. Data pump reale, redirect delle operazioni CRUD write (POST/PATCH), dismissione silos nativi.
