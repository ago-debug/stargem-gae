# RECAP_10_Utenti
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_26_1800)
> Stato chat: 🟡 F1/F2 Fase 1 chiusa — Fase 2 (validazioni real-time + 54 campi UI) da partire
> Ultimo protocollo: F1-014 / F2-012 (chiuse il 15/04)

---

## 1. SCOPO E PERIMETRO

Modulo per la gestione anagrafica completa dei members (4.918 record,
174 colonne). Governa form anagrafica, validazioni (CF, telefono, email),
visibilità in UI dei 54+ campi importati ma nascosti, badge qualità,
flusso onboarding (self-service, segreteria, WooCommerce).

NON gestisce: tessere associative (vedi Chat_05_GemPass), iscrizioni
(vedi Chat_08_Corsi), pagamenti (vedi Chat_06_Contabilità), staff
participantType (vedi Chat_02_GemStaff), sanitizer.ts (creato da Chat_22b).

Visibile a: admin, operator, segreteria. Self-registration via /registrati.

---

## 2. STATO ATTUALE

### Cosa è già fatto (Fase 1 — F1/F2 chiuse il 15/04)
- AUTH: 7 ruoli allineati in `user_roles` (operator, admin, insegnante,
  client, ecc.) + login email-O-username + forgot-password
  anti-user-enumeration + first-login redirect per ruolo
- 14 staff `@studio-gem.it` con `email_verified=1`
- Deploy script `scripts/deploy-vps.sh` creato
- Regola VPS: `/opt/plesk/node/24/bin/npm install` prima del build
- GEMPORTAL: 3 tabelle (gem_conversations, gem_messages, member_uploads),
  TeoBot con Claude SDK attivo, 7 route GemChat (A-G), badge navbar,
  `/area-tesserati` live in produzione
- ONBOARDING: F1-014 flussi onboarding (self-service, segreteria, WC),
  F2-012 pagina `/registrati` e flussi login B2C
- Tuning GDPR + Tutori Minori in `schema.ts`
- Age checking dinamico (TIMESTAMPDIFF server-side)
- Backup: `gemportal_COMPLETO_20260415_0759.sql` (11MB)

### Cosa è già fatto (post Chat_22b)
- `sanitizer.ts` attivo su 5 route members
  (UPPER cognome/nome/CF, LOWER email, TITLE CASE indirizzo)
- `cf-validator.ts` algoritmo italiano disponibile in `shared/utils/`
- 3.949 record `members` retroattivamente normalizzati
- 8 membri con CF mancante segnalati con `data_quality_flag` rosso

### ⚠️ Da verificare all'apertura della chat
- Tra 25/04 e 28/04 `members` è cresciuto da 4.489 a **4.918** (+429 record).
  Possibile import non documentato o auto-registrazioni B2C massive.
  AUDIT richiesto.
- Il recap originale del 26/04 cita "members 4.342 record" — ma il valore
  era 4.489 al 25/04 (audit ufficiale) e 4.918 al 28/04. Discrepanza di
  numerazione anche nel recap stesso.

### Cosa è in corso
- Niente di operativo. La Fase 2 non è ancora partita.

### Cosa è bloccato
- Apertura operativa da subordinare a chiarimento delta `members` +429.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record (28/04) | Note |
|---|---|---|---|
| `members` | TABELLA PRINCIPALE | 4.918 | 174 colonne, era 4.489 il 25/04 |
| `users` | account auth | 19 | account staff |
| `user_roles` | ruoli | 7 | colonna `name` (NON roleName) |
| `gem_conversations` | chat B2C | 0 | scaffolding ready |
| `gem_messages` | messaggi chat | 0 | scaffolding ready |
| `member_uploads` | documenti B2C | 0 | scaffolding ready |
| `member_relationships` | parentele | 0 | dovrebbe avere dati — anomalia |
| `cities` | comuni | 7.904 | seed |
| `provinces` | province | 107 | seed |
| `countries` | nazioni | 1 | da popolare |

---

## 4. FILE CHIAVE NEL CODEBASE

- `client/src/pages/members.tsx` — lista anagrafica + badge CF mancante
- `client/src/pages/anagrafica-home.tsx` — pannello dettaglio + alert qualità
- `client/src/pages/maschera-input-generale.tsx` — form input completo
- `client/src/pages/registrati.tsx` — auto-registrazione B2C
- `client/src/pages/area-tesserati.tsx` — pannello B2C live
- `server/routes/members.ts` — API anagrafica
- `server/routes/auth.ts` — login, forgot-password, first-login
- `server/utils/sanitizer.ts` — applicato a 5 route members + WC webhook
- `shared/utils/cf-validator.ts` — algoritmo italiano (Chat_22b) — DA COLLEGARE FRONTEND
- `shared/schema.ts` § members + § users + § auth

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — Validazione CF in tempo reale (frontend)
- **Cosa decidere:** dove e come collegare `cf-validator.ts` al form
- **Stato:** ⏳ aperta — prioritaria
- **Comportamento atteso:**
  - CF inserito → valida subito
  - Invalido → errore rosso immediato
  - Valido → auto-compila data nascita, sesso, luogo nascita (Belfiore)
  - Incongruente con nome/cognome → warning

### Decisione 2 — Validazione telefono ed email
- **Stato:** ⏳ aperta
- **Note:** formato italiano o internazionale per telefono. Email formato
  valido in real-time, in futuro link conferma.

### Decisione 3 — SMS OTP per auto-registrazione
- **Stato:** ⏳ aperta
- **Note:** non obbligatoria per inserimento da team — solo per B2C self.

### Decisione 4 — Mappatura badge qualità in anagrafica
- **Cosa decidere:** colori e priorità di visualizzazione
  - `mancano_dati_obbligatori` → 🔴 rosso (CF MANCANTE — già attivo)
  - `tessera_mancante_da_assegnare` → 🟡 giallo
  - `omonimo_da_verificare` → 🔴 rosso
  - `da_verificare` → 🟠 arancio (24 tessere bonifica)
  - `incompleto` → ⚪ grigio
- **Stato:** ⏳ aperta — schema concordato con Chat_05

### Decisione 5 — UI per i 54+ campi nascosti
- **Cosa decidere:** layout (raggruppamenti, accordion, tab dettaglio?)
  - Contatti: mobile, secondary_email, email_pec, whatsapp
  - Indirizzo: address, city, province, postal_code, region, nationality
  - Tutori: tutor1_*, tutor2_* (CF, phone, email, birth_date, birth_place)
  - Consensi: consent_sms, consent_image, consent_newsletter, privacy_*
  - Azienda: company_name, company_fiscal_code, company_city, p_iva
  - Documento: document_type, document_expiry
  - Banca: bank_name, iban
  - Misure: size_shirt, size_pants, size_shoes, height, weight
  - Emergenza: emergency_contact_1/2/3 (name, phone, email)
  - Studi: education_title, education_institute
  - Tracking: fattura_fatta, athena_id, from_where
  - Professionali: albo_*, patente_*, car_plate
- **Stato:** ⏳ aperta

### Decisione 6 — Workflow per 179 persone non identificabili
- **Stato:** ⏳ aperta — `nome_match` da bonificare

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1) — Fase 1 chiusa
- F1-001 → F1-013 — ✅ tutti chiusi (auth, ruoli, GemPortal, member_uploads,
  TeoBot, age checking)
- F1-014 — ✅ flussi onboarding (self/segreteria/WooCommerce)

### Frontend (F2) — Fase 1 chiusa
- F2-001 → F2-011 — ✅ tutti chiusi (login, registrati, area-tesserati,
  GemChat 7 route, badge navbar)
- F2-012 — ✅ pagina /registrati e flussi login B2C

### Fase 2
- Non ancora iniziata. F1-015 / F2-013 saranno i prossimi.

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] **AUDIT pre-operativo**: chiarire delta `members` +429 tra 25/04 e 28/04
2. [ ] Collegare `cf-validator.ts` al form anagrafica (auto-compila)
3. [ ] Validazione telefono real-time
4. [ ] Validazione email real-time
5. [ ] Mostrare 54+ campi nascosti in UI (decisione 5)
6. [ ] Implementare badge qualità colorati (5 colori)
7. [ ] (segreteria) Completare CF degli 8 membri flaggati
8. [ ] Workflow per le 179 persone con `nome_match` da bonificare
9. [ ] Verifica SMS OTP per auto-registrazione (futura)
10. [ ] Verifica `member_relationships` (record=0 — anomalia)

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_22b_ImportExport** — ha creato `sanitizer.ts` (UPPER/LOWER/TITLE CASE)
  attivo su 5 route members.
- **Chat_22b_Bonifica** — ha creato `cf-validator.ts` e flaggato 8 membri.
  Smart Routing import attivo.
- **Chat_05_GemPass** — i 8 senza CF non possono avere tessera. Sinergia
  sui badge qualità.
- **Chat_02_GemStaff** — `participantType='INSEGNANTE'` filtra da members.
  Validazione email real-time è interesse comune.
- **Chat_06_Contabilità** — anagrafica corretta è prerequisito per fatturazione.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **`members.user_id`** è FK varchar(255) → `users.id` varchar(255)
  con `onDelete: set null`. NON cambiare.
- **`user_roles.name`** è il nome corretto della colonna (NON `roleName`).
- **`user_id` NULL** = nessun account associato; `user_id` valorizzato
  = login attiva.
- **Policy due cappelli**: doppio ruolo = 2 account separati.
- **`street_address` è ghost column** nel DB (DROP impossibile per row
  size limit MariaDB 8126 byte) — codice usa `address`, ignora il vecchio.
- **`sanitizer.ts` attivo automaticamente** su tutti i salvataggi —
  nessuna logica duplicata in nuovi form.
- **`cf-validator.ts`** già esiste, non ricrearlo, solo importarlo.
- **8 senza CF**: BELLONI, BOCCHETTI MALTSEVA, BURANI, CIONI, GIACOSA,
  GULIZIA, MONTANI, MOUTIQ.
- **3.949 record** già normalizzati retroattivamente — nessun bisogno
  di rinormalizzare.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat10_Utenti_2026_04_26_1800 + audit DB 28/04 + memoria progetto*
