# RECAP_04_MedGem
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_12_2047)
> Stato chat: 🔴 Da iniziare — briefing pronto, F1/F2 mai emessi
> Ultimo protocollo: F1-000 / F2-000

---

## 1. SCOPO E PERIMETRO

Modulo verticale per la gestione delle prenotazioni dello studio medico
interno alla struttura. Governa medici, pazienti, slot configurabili,
tariffe per medico × tipo visita, sync calendario esterno (iCal/Google),
incassi medicali, notifiche, predisposizione online booking.

NON gestisce: certificati medici dei membri (vedi `medical_certificates`
gestiti da Chat_22b/Bonifica e visibili in Anagrafica), affitti studio
generici (vedi Chat_14_BookGem), pagamenti corsi (vedi Chat_06).

Visibile a: admin (tutto), segreteria (agenda+storico tutti medici),
medico (solo sua agenda).

---

## 2. STATO ATTUALE

### Cosa è già fatto
- Brief architetturale completato il 12/04/2026
- Decisioni di base fissate (vedi sezione 5)
- File Excel di riferimento analizzato:
  `medgem_2526_prenotazioniaffitto_studio_medico_mensile.xlsx`
  - 10 fogli mensili (set 2025 → apr 2026 + futuri)
  - Medici attivi: Yuri, Nella (+ Nisi negli elenchi)
  - Slot da 10 minuti
  - PAGATO: SI / NO / C/C

### Cosa è in corso
- Niente. La chat è ferma in attesa di emissione F1-001/F2-001.

### Cosa è bloccato
- Aggiunta del ruolo `MEDICO` a `user_roles` (config).
- Aggiunta del valore `'MEDICO'` a `members.participantType` per i medici.

---

## 3. TABELLE DB COINVOLTE

### Tabelle DA CREARE (con F1-001)

| Tabella | Ruolo |
|---|---|
| `medical_appointments` | Cuore del modulo — ogni prenotazione |
| `medical_visit_types` | Tipi di visita configurabili |
| `medical_doctor_config` | Disponibilità per medico/giorno/studio |
| `medical_slot_pricing` | Tariffe medico × tipo visita |
| `medical_calendar_links` | Sync calendari esterni |
| `medical_notifications_log` | Tracciamento invii notifica |

### Tabelle ESISTENTI (nessuna modifica strutturale)

| Tabella | Utilizzo | Modifica |
|---|---|---|
| `members` | medici + pazienti | NESSUNA — solo aggiunta valore `participantType='MEDICO'` |
| `studios` | sede della visita | NESSUNA |
| `payments` | incasso opzionale | NESSUNA — solo FK opzionale |
| `user_roles` | nuovo ruolo MEDICO | solo config |

---

## 4. FILE CHIAVE NEL CODEBASE (DA CREARE)

- `client/src/pages/medgem.tsx` — pagina con 4 tab
- `client/src/components/MedGemBookingModal.tsx` — modale prenotazione 5 sezioni
- `server/routes/medgem.ts` — API completa modulo
- `shared/schema.ts` § medical_*

Non esistono ancora — saranno creati in F1-001 / F2-001.

---

## 5. DECISIONI ARCHITETTURALI APERTE

Tutte queste sono **già fissate dal briefing del 12/04**, in attesa
solo di esecuzione protocolli:

### Decisione 1 — Rotta frontend
- **Fissata:** `/medgem`

### Decisione 2 — Architettura medici/pazienti
- **Fissata:** medici = members con `participantType='MEDICO'`;
  pazienti = mix members esistenti + quick-add inline (sempre members)

### Decisione 3 — Pagamenti C/C
- **Fissata:** metodo bonifico bancario, può essere ricevuto o in attesa

### Decisione 4 — Tariffe e slot
- **Fissata:** matrice medico × tipo_visita, slot configurabili
  (es. prima visita 20 min, controllo 10 min)

### Decisione 5 — Studio fisico
- **Fissata:** 1 studio attivo, architettura predisposta per multi-studio
  via `studio_id`

### Decisione 6 — Accesso medico
- **Fissata:** login StarGem ruolo `MEDICO`, vede solo il suo calendario

### Decisione 7 — Sync calendario esterno
- **Fase 1 (ora):** iCal feed statico per medico
- **Fase 2 (futuro):** push Google Calendar via OAuth2

### Decisione 8 — Online booking
- **Fissata:** predisporre ora, attivare in futuro

### Decisione 9 — Design
- **Fissata:** stile oro3d nativo del gestionale

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
*Nessuno. Il prossimo sarà F1-001 (creazione 6 tabelle MedGem).*

### Frontend (F2)
*Nessuno. Il prossimo sarà F2-001 (struttura `/medgem` con 4 tab).*

---

## 7. PENDENTI

In ordine di esecuzione:

1. [ ] **F1-001** — creare 6 tabelle `medical_*` + aggiungere ruolo `MEDICO`
2. [ ] **F2-001** — pagina `/medgem` con 4 tab + modale prenotazione 5 sezioni
3. [ ] Endpoint API completi (vedi sezione 4 del briefing originale)
4. [ ] Matrice permessi per ruolo (Admin/Segreteria/Medico)
5. [ ] Notifiche multicanale (SMS/WhatsApp/email per paziente, interna per medico)
6. [ ] Sync iCal feed Fase 1
7. [ ] Predisposizione online booking
8. [ ] Importazione storica dal file Excel (mesi precedenti)
9. [ ] Sync Google Calendar Fase 2 (futuro)

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_22b/Bonifica** — `medical_certificates` (2.867 record) è una
  tabella diversa: serve per i certificati di idoneità sportiva dei members,
  non per le visite presso il nostro studio medico.
- **Chat_14_BookGem** — gestione prenotazioni studi generici. Architettura
  parallela: niente conflitti, MedGem ha la sua tabella dedicata.
- **Chat_06_Contabilità** — `payments.appointment_id` come FK opzionale
  (futura, da aggiungere quando si collegherà l'incasso).
- **Chat_10_Utenti** — i pazienti finiscono in `members`. Coordinare regole
  di sanitizzazione e flag qualità.
- **Chat_01_Quote_e_Promo** — `medical_slot_pricing` è separata da
  `price_matrix`. Niente conflitto.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **NON toccare** `members.participantType` direttamente: aggiungere
  `'MEDICO'` solo via F1-001 (script controllato).
- **NON toccare** `studios`: usata da MedGem solo come FK.
- **Architettura predisposta multi-studio**: anche se 1 studio attivo,
  `studio_id` è già nelle tabelle.
- **Medici attivi confermati nel file Excel**: Yuri (Cogliandolo?),
  Nella, Nisi.
- **Slot di default file Excel**: 10 minuti — cambiabile per medico × visita.
- **Stagione attiva**: 25/26 (`season_id=1`).
- **Online booking**: predisporre ora, non attivare. `booking_status`
  include `pending_online`, `created_by` nullable.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat04_MedGem_2026_04_12_2047 (briefing architetturale)*
