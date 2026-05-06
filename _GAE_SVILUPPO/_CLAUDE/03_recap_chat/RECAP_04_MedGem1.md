# 🏥 RECAP — Chat 04: MedGem
> File di handoff da caricare nel Progetto Claude.
> Da leggere da tutte le chat attive prima di toccare tabelle, membri o studi fisici.

---

## 📅 Data sessione
**12/04/2026 — Sessione di progettazione (nessun protocollo ancora emesso)**

---

## 💬 NOME CHAT
**`04_MedGem`**

---

## 🎯 OBIETTIVO
Progettare il modulo **MedGem** per la gestione delle prenotazioni dello studio medico interno alla struttura. Il modulo nasce come verticale autonomo integrato nell'architettura StarGem esistente, senza rompere nulla di già funzionante.

---

## ✅ STATO SESSIONE
**Fase:** Brief architetturale completato — in attesa di emissione protocolli F1/F2.
**Prossimi protocolli da emettere:**
- `F1-099` — Creazione tabelle MedGem in MySQL
- `F2-112` — Struttura pagina `/medgem` con tab + agenda base

---

## 📐 DECISIONI ARCHITETTURALI FISSATE

| Tema | Decisione |
|------|-----------|
| **Rotta frontend** | `/medgem` |
| **Medici in anagrafica** | `members` con `participantType = 'MEDICO'` |
| **Pazienti** | Mix members esistenti + quick-add inline → sempre su `members` |
| **C/C** | Metodo pagamento = bonifico bancario (può essere ricevuto o ancora in attesa) |
| **Tariffe** | Matrice `medico × tipo_visita` |
| **Slot** | Configurabile per medico + tipo visita (es. prima visita 20 min, controllo 10 min) |
| **Studio fisico** | 1 ora → architettura predisposta per 2 (multi-studio ready via `studio_id`) |
| **Accesso medico** | Login StarGem con ruolo `MEDICO` → vede solo il suo calendario |
| **Sync calendario** | Fase 1: iCal feed statico per medico. Fase 2 (futuro): push Google Calendar API |
| **Online booking** | Da predisporre ora, da attivare in futuro |
| **Design** | Stile oro3d — nativo al gestionale |

---

## 🗄️ DATABASE — NUOVE TABELLE DA CREARE (F1-099)

### `medical_appointments`
Cuore del modulo. Ogni prenotazione medica.
```
id, doctor_member_id (FK→members), patient_member_id (FK→members),
studio_id (FK→studios), appointment_date, start_time, end_time,
slot_minutes, visit_type_id (FK→medical_visit_types),
booking_status,     -- scheduled | confirmed | cancelled | no_show
visit_status,       -- pending | completed | not_done
payment_status,     -- unpaid | paid | cc_pending | cc_received
payment_method,     -- cash | cc | pos | other
receipt_number, amount,
payment_id (FK→payments, nullable),
notes_clinical, notes_admin,
visit_closed_at,
google_event_id, outlook_event_id,
created_by (FK→users), updated_by (FK→users),
created_at, updated_at
```

### `medical_visit_types`
Tipi di visita configurabili (Prima visita, Controllo, Refertazione, ecc.)
```
id, name, default_slot_minutes, is_active
```

### `medical_doctor_config`
Disponibilità oraria per medico, giorno e studio.
```
id, doctor_member_id, weekday (0–6),
start_time, end_time, studio_id,
is_active, valid_from, valid_to
```

### `medical_slot_pricing`
Tariffe per combinazione medico × tipo visita. Override durata slot.
```
id, doctor_member_id, visit_type_id,
slot_minutes (override),
price, is_active
```

### `medical_calendar_links`
Sync con calendari esterni per medico.
```
id, doctor_member_id,
provider,           -- google | outlook | ical
calendar_id, access_token, refresh_token,
ical_feed_url,      -- feed pubblico sola lettura (Fase 1)
sync_mode,          -- push_only | bidirectional (futuro)
is_active, last_synced_at
```

### `medical_notifications_log`
Tracciamento di tutti gli invii notifica.
```
id, appointment_id,
channel,            -- sms | whatsapp | email | push
recipient_type,     -- patient | doctor | secretary
recipient_contact,
event_type,         -- booking | reminder | cancellation | reschedule
delivery_status,    -- sent | failed | pending
sent_at
```

---

## 🔌 TABELLE ESISTENTI — NESSUNA MODIFICA STRUTTURALE

| Tabella | Utilizzo in MedGem | Modifica richiesta |
|---------|-------------------|-------------------|
| `members` | Medici (participantType='MEDICO') + Pazienti | ❌ Nessuna |
| `studios` | Studio fisico dove si svolge la visita | ❌ Nessuna |
| `payments` | Incasso formale opzionale | ❌ Nessuna |
| `user_roles` | Aggiunta ruolo `MEDICO` | ⚠️ Solo configurazione |

---

## 🌐 ENDPOINT API DA CREARE (F1-099)

```
GET/POST    /api/medgem/appointments
GET/PUT     /api/medgem/appointments/:id
DELETE      /api/medgem/appointments/:id
GET         /api/medgem/slots-disponibili?doctor=&date=
GET/POST    /api/medgem/visit-types
GET/POST    /api/medgem/doctor-config
GET/POST    /api/medgem/slot-pricing
POST        /api/medgem/appointments/:id/payment
GET         /api/medgem/calendar-feed/:doctorId     ← iCal feed pubblico
POST        /api/medgem/sync-google/:doctorId
GET         /api/medgem/stats?from=&to=&doctor=
```

---

## 🖥️ FRONTEND — STRUTTURA PAGINA `/medgem` (F2-112)

### 4 Tab con visibilità condizionale per ruolo

| Tab | Contenuto | Admin | Segreteria | Medico |
|-----|-----------|-------|------------|--------|
| **Agenda** | Vista giorno/settimana/mese + griglia slot | ✅ tutti | ✅ tutti | ✅ solo sé |
| **Storico** | Lista filtrabile prenotazioni + export CSV | ✅ | ✅ | ❌ |
| **Statistiche** | KPI incassi, visite, no-show, C/C pending | ✅ | ❌ | ❌ |
| **Configurazione** | Medici, slot, tariffe, sync calendario | ✅ | ❌ | ❌ |

### Modale Prenotazione — 5 sezioni
- **A — Slot:** medico + data/ora + tipo visita (→ durata e tariffa auto)
- **B — Paziente:** ricerca live members + quick-add inline (salva su members)
- **C — Visita:** stato, visita effettuata, note cliniche/admin, chiusura
- **D — Pagamento:** importo, stato, metodo, ricevuta, pulsante Incassa
- **E — Notifiche:** SMS/WhatsApp paziente, notifica medico, log esiti

---

## 🔔 NOTIFICHE PREVISTE

| Evento | Destinatario | Canale |
|--------|-------------|--------|
| Nuova prenotazione | Paziente | SMS/WhatsApp |
| Nuova prenotazione | Medico | Notifica interna |
| Reminder | Paziente | SMS/WhatsApp (giorno prima) |
| Annullamento / spostamento | Segreteria | Notifica interna |

---

## 🔐 MATRICE PERMESSI

| Ruolo | Agenda | Storico | Stats | Config |
|-------|--------|---------|-------|--------|
| Admin | ✅ tutti i medici | ✅ | ✅ | ✅ |
| Segreteria | ✅ tutti i medici | ✅ | ❌ | ❌ |
| Medico | ✅ solo se stesso | ❌ | ❌ | ❌ |

---

## 📅 SYNC CALENDARIO ESTERNO

**Fase 1 — ora:** iCal feed statico per medico (URL con token). Il medico incolla in Google Calendar / Outlook / Apple Calendar. Si aggiorna automaticamente ad ogni modifica.

**Fase 2 — futuro:** Push attivo su Google Calendar API via OAuth2 in tempo reale.

---

## 🚀 PREDISPOSIZIONE ONLINE BOOKING

Già prevista nell'architettura:
- `booking_status` include valore `pending_online`
- `created_by` nullable (prenotazione autonoma senza operatore)
- `/api/medgem/slots-disponibili` pensata per essere esposta pubblicamente
- Nessuna rottura necessaria per attivare il booking online in futuro

---

## ⚠️ AVVISI ALLE ALTRE CHAT

### 📢 Chat Bug Fix + STI
- **Non toccare** `members.participantType` — MedGem aggiungerà il valore `'MEDICO'` tramite protocollo F1-099.
- **Non toccare** `studios` — usata da MedGem per `studio_id`.
- Nessun conflitto attivo con la migrazione STI in corso.

### 📢 Chat Quote e Promo
- Nessun conflitto diretto.
- MedGem usa `payments` solo come FK opzionale (nessuna modifica alla tabella).
- Le tariffe MedGem vivono in `medical_slot_pricing` — separata da `price_matrix`.

---

## 📁 FILE EXCEL ANALIZZATO

**`medgem_2526_prenotazioniaffitto_studio_medico_mensile.xlsx`**
- 10 fogli mensili (Settembre 2025 → Aprile 2026 + mesi futuri)
- Struttura per colonne: CHI SCRIVE | ORA | MINUTI | COGNOME | NOME | ETÀ | CELL | PAGATO | VISITA FATTA | N. RICEVUTA
- Medici attivi: **Yuri** e **Nella** (+ Nisi menzionato negli elenchi)
- Slot standard da 10 minuti nel file attuale
- PAGATO: SI / NO / C/C (bonifico ricevuto o in attesa)
- Foglio `elenchi`: vocabolari CHI SCRIVE, STUDIO, ORA, MINUTI, MEDICO

---

*Recap prodotto da Chat 04_MedGem — 12/04/2026*
