# AUDIT F1-PROTOCOLLO-021: Campi DB per Schede Dettaglio (Domeniche, LI, Campus)
**Data:** 29/04/2026
**Modalità:** SOLA LETTURA + QUERY DB

## A) MAPPA SCHEMA DB
Attraverso comandi raw `DESCRIBE`, si conferma l'esistenza dei seguenti campi chiave:
- **`courses`**: `start_date`, `end_date`, `day_of_week`, `start_time`, `end_time`, `instructor_id`, `studio_id`, `name`, `sku`, `activity_type`, `lesson_type`.
- **`enrollments`**: `member_id`, `course_id`, `status`, `participation_type`, `details` (LONGTEXT per metadati liberi), `target_date`.
- **`members`**: `first_name`, `last_name`, `date_of_birth`, `phone`, `email`, `is_minor`, `father_first_name`, `mother_first_name`, `tutor1_fiscal_code`, `tutor2_first_name`. *(Nota: `tutor1_first_name` e `last_name` sembrano assenti, sostituiti logicamente da father/mother).*
- **`attendances`**: `attendance_date`, `type` (es. 'manual'), `notes`.

---

## B) COVERAGE PER SCHEDA

### SCHEDA DOMENICA
| Campo Richiesto | Disponibile? | Sorgente | Note |
|---|---|---|---|
| Anagrafica base | SÌ | `members` | `first_name`, `last_name`, `date_of_birth` |
| Contatti | SÌ | `members` | `phone`, `mobile`, `email` |
| Tessera | SÌ | `memberships` | Join su `member_id` per `status` e `expiry_date` |
| Certificato | SÌ | `medical_certificates` | Join per `status` e `expiry_date` |
| Pagamento iscrizione | SÌ | `payments` | Join su `enrollment_id` |
| **Data Domenica** | **PARZIALE** | `courses.start_date` | Il record testato (`2526DOSSANTO09NOV-B`) ha `start_date` = NULL. Il dato esiste nel nome/SKU ma manca il dato strutturato. |
| Tipo attività | SÌ | `courses.name` | Es. "Domeniche in Movimento - Gestualità" |
| Insegnante | PARZIALE | `courses.instructor_id` | È NULL nel record testato. Deve essere valorizzato. |
| Studio / Sala | PARZIALE | `courses.studio_id` | È NULL nel record testato. |
| Stato Presenza | PARZIALE | `attendances` | Esiste tabella log, ma manca colonna `status` (presente/assente) se non codificata via `type`. |

### SCHEDA LEZIONE INDIVIDUALE (LI)
| Campo Richiesto | Disponibile? | Sorgente | Note |
|---|---|---|---|
| Dati Base Iscritto | SÌ | `members` ecc. | Stessi di Domenica |
| **Insegnante Assegnato** | **NO** | ? | Essendo "Lezione Individuale" un corso unico macro (`2526LEZINDIVIDUALE`), `instructor_id` in `courses` non vale per l'utente specifico. |
| **Giorno/Orario fisso** | **NO** | ? | Il corso macro non ha orari per i singoli iscritti. |
| Sala | NO | ? | Stesso problema del corso macro. |
| Pacchetto + Residue | NO | ? | Non esistono colonne native in `enrollments`. Serve usare JSON `details` o nuova struttura. |
| Storico lezioni svolte | SÌ | `attendances` | Date in cui il membro ha strisciato o segnato presenza. |
| Prossima programmata | NO | ? | Manca tabella `bookings` se l'orario non è fisso. |

### SCHEDA CAMPUS
| Campo Richiesto | Disponibile? | Sorgente | Note |
|---|---|---|---|
| Dati Minore + Contatti | SÌ | `members` | `is_minor`, padre/madre. |
| Settimana Campus | PARZIALE | `courses.start_date` | Il record `2526CAMPUSS2` ha date = NULL. |
| Tipo campus | PARZIALE | `courses.name` | Manca una tipologia strutturata forte. |
| Orari giornalieri | NO | `courses.start_time` | I campi `start_time`/`end_time` sono NULL per il campus testato. |
| **Pasto / Extra** | **NO** | ? | Manca in `enrollments`. Si può usare `details` JSON. |
| Nome Accompagnatore | SÌ | `members.father_...` | Dati presenti. |
| **Gruppo / Classe** | **NO** | ? | Nessuna entità DB per raggruppare i bambini. |

---

## C) CAMPI MANCANTI & ACTION PLAN (Raggruppati)

1. **Dati Esistenti ma Non Popolati in DB:** 
   - `start_date`, `end_date`, `start_time`, `end_time`, `instructor_id`, `studio_id` per i corsi generati come Domeniche e Campus. (Da correggere a livello di inserimento dati).
2. **Campi che richiedono JSON o Colonne (`enrollments`):**
   - Pasto, extra, gruppi (Campus).
   - Insegnante, giorno e orario per il singolo allievo (Lezioni Individuali).
3. **Campi che richiedono Nuove Tabelle o Logiche Appositive:**
   - Prenotazione delle prossime lezioni individuali (se slegate da orario fisso).
   - Stato presenze/assenze in `attendances`.

## D) RACCOMANDAZIONI CHAT FUTURE
| Dominio | Riferimento Futuro | Azione Suggerita |
|---|---|---|
| **Domeniche** | `Chat_13 Domeniche` | Forzare il popolamento di `start_date`, orari, sala e istruttore quando si crea il corso Domenica in DB. Standardizzare enum `attendances`. |
| **Lez. Individuali** | `Chat_LI` o `Chat_05` | Definire come storare i pacchetti: in JSON `enrollments.details` oppure in tabelle child. Idem per insegnante assegnato (che differisce dal "corso" macro). |
| **Campus** | `Chat_11 Campus` | Definire struttura per i form di iscrizione (Pasti/Gruppi) usando `enrollments.details`. Forzare l'impostazione di data e orari nel record del Campus. |

*(Audit di sola lettura terminato con successo)*
