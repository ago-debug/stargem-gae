Aggiornato al: 2026-04-27 13:00

# Master Document: Architettura e Database StarGem Manager (Stato Attuale)

Questo documento rappresenta la mappa completa ed esaustiva di tutte le sezioni del gestionale. Sostituisce i precedenti file frammentati di analisi strutturale e funge da *Source of Truth* (SOT) per l'architettura dati dopo la migrazione a Single Table Inheritance (STI).

---

## 1. La Suite StarGem (Mappatura Applicativa)

La suite consta di 22 moduli potenziali. I principali sono già tracciati a database.

| Sezione / Modulo | Scopo Operativo | Architettura DB (Attuale / Futura) | Stato |
| :--- | :--- | :--- | :--- |
| **Core Anagrafica** | Nucleo per tutti i profili. | `members`, `member_relationships`, `cli_cats` | ✅ Stabile |
| **Gemdario (Calendario)**| Motore STI: Corsi, iscrizioni, presenze. | `courses`, `enrollments` | ✅ Operativo |
| **BookGem (Booking)** | Prenotazioni, affitti spazi e sale. | `studios`, `studio_bookings` | ✅ Operativo |
| **MedGem (Medico)** | Pannello idoneità sportive. | `medical_certificates` intrecciata a `members` | ✅ Stabile |
| **GemStaff / GemTeam** | Contrattualistica HR e Tracking lavorativo. | `users`, `staff_presenze`, `payslips` | ✅ Operativo |
| **Gemory (Project Mgr)**| Comunicazione p2p tra segretari. | `todos`, `team_notes`, `team_comments` | ✅ Operativo |
| **Contabilità & Cassa** | Libro mastro, quote, sconti. | `payments`, `quotes`, `cost_centers`, `carnet_wallets` | ⏳ Lavorazione |
| **SysAdmin & Log** | Core configurazione liste dinamiche. | `custom_lists`, `system_configs`, `user_activity_logs` | ✅ Stabile |
| **Clarissa (CRM & IA)** | Marketing automation. | `marketing_campaigns`, `automation_rules` | ⬜ Da Progettare |
| **Kiosk: Firma Digitale**| Tablet per firma documenti legali. | `member_forms_submissions` | ⬜ Futuro |
| **Buvette & POS** | Venditorio fisico. | `inventory_items`, `stock_movements` | ⬜ Futuro |

---

## 2. Architettura Dati: Le 8 Macro-Aree (72 Tabelle)

### A. Autenticazione & Utenti
- **`users`**, **`user_roles`**: Account e permessi (3 tier: team, staff, utenti).
- **`sessions`**, **`express_sessions`**: Sessioni e heartbeat. La presenza è gestita con logiche di tolleranza e "tempo netto".

### B. Configurazione & Utility
- **`system_configs`**, **`custom_lists`**, **`custom_list_items`**: Vocabolari e opzioni.
- **`user_activity_logs`**: Audit e log operazioni.

### C. Anagrafica Centrale (The Core)
- **`members`**: Tabella "piatta" per iscritti e docenti. Tutte le anagrafiche, genitori e tutori convergono qui.
- **`member_relationships`**: Raccordi parentali complessi.

### D. Attività Didattiche (Erogatore STI)
- **`courses`**: Motore erogativo unitario per Corsi, Workshop, Campus.
- **`enrollments`**: Ponte associativo (many-to-many) tra persona (`members`) e classe (`courses`).
- *Nota:* I 16 silos legacy sono stati unificati tramite Single Table Inheritance (STI). 

### E. Tesseramenti e Servizi Extra
- **`memberships`**: Tessere associative, vincolate al flusso economico. 
- **`medical_certificates`**: Gestione visite mediche.
- **`studio_bookings`**, **`booking_services`**: Prenotazioni spazi nudi (Affitti).

### F. Finanza e Pagamenti
- **`payments`**: La *Junction Table* fiscale. **Tassativo:** Nessuna transazione può essere salvata senza una `foreign_key` verso la prestazione (es. `enrollment_id`, `membership_id`).
- **`quotes`**, **`price_lists`**, **`carnet_wallets`**: Logiche di prezzo, pacchetti e tariffe.

### G. HR: GemStaff e GemTeam
- **`staff_presenze`**, **`staff_sostituzioni`**: Timbrature docenti e desk.
- **`payslips`**, **`staff_contracts_compliance`**: Buste paga e documenti.

### H. Comunicazioni
- **`team_comments`**, **`todos`**, **`notifications`**: Flussi di task e post-it interni.

---

## 3. Infrastruttura Server e Cloud
- **VPS IONOS**: IP `82.165.35.145` (Ubuntu 24.04).
- **Reverse Proxy**: Nginx porta il traffico alla porta Node `5001`.
- **Database**: `stargem_v2` (MariaDB 11.4 locale, isolato dall'esterno).
- **Sviluppo Locale**: La connessione al DB avviene tramite SSH Tunnel persistente (`scripts/tunnel-db.sh`).

---

## 4. Regole Auree (Change Control)
1. **Unificazione STI**: Mai creare nuove tabelle di attività separate. Usare la gerarchia: Macro-Attività -> Categorie (`categories`) -> Singolo Corso (`courses`) -> Iscritti (`enrollments`).
2. **Pagamenti Blindati**: Non forzare mai la creazione di record in `payments` che risultino slegati (`orfani`) dall'entità di iscrizione/acquisto.
3. **Migrazione Dati**: Le tabelle strutturali (`custom_lists`) si alterano con *UPDATE in-place*, non con DELETE/INSERT, a causa dei vincoli *ON DELETE CASCADE*.
4. **Modello Persone Fluido**: Un `member` può avere molteplici cappelli (Studente, Docente, Affittuario). Non frammentare l'anagrafica in più tabelle fisiche per ruolo.
