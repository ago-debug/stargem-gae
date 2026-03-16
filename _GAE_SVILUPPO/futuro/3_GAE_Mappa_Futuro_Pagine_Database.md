# Mappa Globale FUTURA: Pagine UI vs Motore SaaS (Single Table Inheritance)

> [!NOTE] 
> **Scopo di questo documento**
> Questo file è la **Mappa Geografica del Frontend V2 (Fase 3)**. Illustra come l'interfaccia React dovrà collegarsi in futuro al nuovo database unificato SaaS (Single Table Inheritance). Serve agli sviluppatori Frontend per capire in quali endpoint inviare i dati quando le 11 tabelle separate cesseranno di esistere e l'attività diventerà un concetto universale gestito tramite `activities` e `activity_categories`.

Questo documento traccia la mappa architetturale **Futura** del gestionale, a valle del refactoring SaaS previsto. Illustra come l'interfaccia React si collegherà al nuovo motore unificato Drizzle ORM basato su *Single Table Inheritance*.

## 1. Moduli Core (Motore SaaS Unificato)
*L'architettura attuale a "11 Silos" verrà deprecata a favore di questo nuovo modello unificato. Tutte le precedenti 11 tabelle di erogazione (Corsi, Affitti, Workshop) collasseranno nell'univoca `activities`.*

La UI React continuerà ad avere menu espliciti (personalizzabili dal Cliente tramite `custom_menu_config`), ma punteranno tutte allo **stesso endpoint Drizzle**, differenziandosi unicamente per l'ID della Macrocategoria (`category_id`) che ne istruirà il rendering a schermo (Es. "Mostra Calendario" o "Mostra Maschera Annuale").

| Pagina Web (Es. UI Menu) | Rotta React (SaaS) | Tabella Database Target (V2.0) | Note Architetturali |
|---|---|---|---|
| **Qualsiasi Corsistica / Affitto / Evento** | `/attivita/:slug` | `activities` | Unica tabella definita. Unisce logiche temporali, prezzi, staff e info aggiuntive in JSON (`extraInfoOverrides`). |
| **Configurazione UI / Pre-Seed** | `/admin/categorie` | `activity_categories` | Dichiara il `ui_rendering_type` e l'`extra_info_schema` (JSON) per disegnare i form specifici a schermo. |
| **Profilazione Cliente Base** | `/admin/impostazioni` | `tenants` | Tabella Radice SaaS. Governa Logo, Colori Aziendali e struttura Sidebar. |

---

## 2. Moduli Amministrativi e Finanziari

| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Pannello Iscrizioni Rapide** | `/maschera-generale` | 🟡 **Maschera Input** | `members`, `enrollments`, `payments` | Hub Unificato. Non esegue push isolati, ma compila in RAM un carrello annidato JSON (Multi-Persona/Multi-Tessera) elaborato backend in transazione atomica. |
| **Iscrizioni e Pagamenti** | `/iscrizioni-pagamenti` | 🟡 **Iscrizioni e Pagamenti** | Lettura combinata `members`, `enrollments` | Interfaccia d'appoggio per gestione logistica |
| **Nuovo Pagamento** | `/pagamenti` | 🟡 **Lista Pagamenti** | `payments` (Master) | Interfaccia estesa per lo storico saldo e ricevute. Funge da estensione documentale asservita al Carrello. |
| **Scheda Contabile** | `/scheda-contabile` | 🟡 **Scheda Contabile** | Lettura: `payments`, `members` | Sola LETTURA. Incrocia il dovuto col versato. |

---

## 3. Moduli Pianificazione e Aule *(11 Tabelle)*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Pianificazione Attività (Planning vs Calendario)** | `/calendario` | 🟡 **Calendario Corsi** | `activities` (SaaS), `course_schedules` (SaaS), `studios` | *Biforcazione UX Cruciale:* Il **Calendario** è la vista operativa a slot "day-by-day" per l'App Receptionist (prenotazioni realtime). Il **Planning** è la vista mensile/stagionale "Master" per la Regia Aziendale (spostamento corsi base). Si alimentano dallo stesso source. |
| **Pianificazione Sale** | `/prenotazione-sale`| 🟡 **Prenotazione Sale** | `studio_bookings` | Booking per affitti esterni / eventi. (Orfano, andrà annesso ad activities). |

---

## 4. Gestione Anagrafica (Utenti e Staff)

| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Elenco Anagrafiche** | `/anagrafica_a_lista` | 🟡 **Anagrafica a Lista** | `members` | Lista passiva e ricerca soci / tesserati. |
| **Dashboard Membro Singolo** | `/membro/:id` | (Si apre da Anagrafica) | Lettura: `members`, `member_relationships`, `enrollments` | Hub di gestione scheda singola (es. genitore/figlio). |
| **Insegnanti** | `/insegnanti` | 🟡 **Staff/Insegnanti** | `users` (RBAC) | Anagrafica Docenti gestita tramite Role Based Access Control. |
| **Utenti System / Permessi** | `/utenti-permessi` | 🟡 **Utenti e Permessi** | `users`, `user_roles` | Account per accesso al Gestionale. (Email + Password) |

---

## 4. Gestione Struttura, Turni HR e Utility

| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Sale e Aule** | `/studios` | 🟡 **Studios/Sale** | `studios` | Scrive la sala (Capienza, Orari Base). |
| **App Staff (Insegnanti)** | `/app-staff/dashboard` | 🟡 **App Insegnanti** | Lettura: `activities`, `studios`, `enrollments` | Vista riservata ai docenti (Consultazione orari, prenotazione sale prove). |
| **App Team (Amministrazione)** | `/app-team/turni` | 🟡 **App Team (HR)** | `team_shifts`, `users` | Visualizzazione turni di lavoro della segreteria/team e presenze (`instructor_attendances`). |
| **Facility Management** | `/app-staff/manutenzione` | 🟡 **App Team (HR)** | `maintenance_tickets` | Segnalazione ticket guasti istruttori/ispettori alle aule. |
| **Todo List Task** | `/todo-list` | 🟡 **ToDoList** | `todos` | Task collaborative per lo staff. |
| **Note Team / Chat** | `/commenti` | 🟡 **Commenti Team** | `teamComments` | Chat intercom della segreteria. |
| **Log Ingressi Badge** | `/accessi` | 🟡 **Controllo Accessi** | `access_logs` | Lettura/Scrittura gate passaggi tornello/tablet. |

---

## 5. Area CRM e Marketing (Novità SaaS)

| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Gestione Lead/Prospect** | `/crm/leads` | 🟡 **CRM & Marketing** | `crm_leads` (Nuova Tabella) | Tracciamento potenziali clienti (non ancora iscritti) raccogliendo dati da form web esterni o social. |
| **Campagne (Mail/SMS)** | `/crm/campagne` | 🟡 **CRM & Marketing** | `crm_campaigns` (Nuova Tabella) | Storico invii DEM, Newsletter e Promozioni collegate a target specifici (`members` o `crm_leads`). |

---

### Dalla Frammentazione alla Coesione
Il modulo futuro permetterà a CourseManager di essere distribuito a più organizzazioni (Tenants) garantendo flessibilità operativa illimitata attraverso il salvataggio JSONB e la generazione di form dinamici, superando i colli di bottiglia dei vecchi 11 silos in un'unica super-infrastruttura.
