# RECAP_05_GemPass
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_26_1800)
> Stato chat: 🟡 F1/F2 Fase 1 chiusa — Fase 2 (UI fix + nuove funzionalità) da partire
> Ultimo protocollo: F1-007 / F2-007 (22/22 test superati il 12/04)

---

## 1. SCOPO E PERIMETRO

Modulo per la gestione delle tessere associative (memberships) dei members.
Governa l'emissione, il rinnovo, il numero tessera, il barcode, la stagione
di competenza, il tipo di ente (ENDAS/OPES/LIBERTAS), la quota tessera
pagata, l'API pubblica di verifica stato.

NON gestisce: anagrafica members (vedi Chat_10), pagamenti tessera
(vedi Chat_06), bonifica orfani (gestita da Chat_22b/Bonifica chiusa).

Visibile a: admin (tutto), operator (lettura+modifica limitata),
verifica pubblica via API (no auth).

---

## 2. STATO ATTUALE

### Cosa è già fatto (Fase 1 — F1-007/F2-007 chiusa il 12/04)
- Tessere importate: 3.281 record originali
- 22/22 test backend superati
- Backfill `season_competence='2526'` su 2.218 record
- Formato tessera corretto: `2526-000042` (con trattino) — NON modificare
- API pubblica `/api/public/membership-status/:code`
- Tabella `member_forms_submissions` creata
- ALTER memberships: +`is_renewal`, +`renewed_from_id`, +`notes`

### Cosa è già fatto (post Chat_22b Bonifica del 26/04)
- +24 tessere create da bonifica orfani QUOTATESSERA
  (con `data_quality_flag='da_verificare'`)
- ExportWizard con strong typing (date, booleani Sì/No)
- `sanitizer.ts` attivo su tutti i salvataggi
- TZ=Europe/Rome su VPS
- Badge "CF MANCANTE" attivo in UI su 8 membri
  (members.tsx, anagrafica-home.tsx, gempass.tsx)
- Bottone "Crea Tessera" disabilitato per i CF mancanti

### Cosa è in corso
- Niente di attivo. La Fase 2 (UI fix + nuove funzionalità) non è ancora partita.

### Cosa è bloccato
- Per gli 8 membri senza CF la creazione tessera è bloccata via UI
  finché non si completa il CF in anagrafica.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record (28/04) | Note |
|---|---|---|---|
| `memberships` | TABELLA PRINCIPALE | 3.305 | 3.281 originali + 24 da bonifica |
| `seasons` | stagioni | 3 | 1=25/26, 2=26/27, 3=24/25 |
| `members` | anagrafica (FK) | 4.918 | data_quality_flag usato per badge |
| `member_forms_submissions` | firme digitali | 1 | scaffolding ready, kiosk Phase 2 |
| `payments` | quota tessera (FK) | 12.062 | tramite payments.membership_id |

---

## 4. FILE CHIAVE NEL CODEBASE

- `client/src/pages/gempass.tsx` — modulo principale
- `client/src/pages/memberships.tsx` — vista lista tessere
- `client/src/pages/anagrafica-home.tsx` — alert CF mancante
- `client/src/pages/members.tsx` — badge CF mancante in lista
- `server/routes/gempass.ts` — API tessere
- `server/routes/public.ts` — API pubblica `/membership-status/:code`
- `shared/schema.ts` § memberships
- `server/utils/sanitizer.ts` — applicato anche su gempass save

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — Tabella `membership_events`
- **Cosa decidere:** struttura della tabella per storico azioni tessera
  (emissione, rinnovo, sospensione, riattivazione)
- **Stato:** ⏳ aperta — DA CREARE in Fase 2
- **Note:** campi suggeriti `id, membership_id, event_type, event_date, notes, operator_id`

### Decisione 2 — Bottone "Dati da verificare"
- **Cosa decidere:** filtro UI che raggruppa
  - `data_quality_flag='da_verificare'` (24 tessere bonifica)
  - `data_quality_flag='tessera_mancante_da_assegnare'`
- **Stato:** ⏳ aperta

### Decisione 3 — Funzione "Assegna Tessera" rapida
- **Cosa decidere:** flusso UI per assegnare tessera ai 1.322 membri con
  `tessera_mancante_da_assegnare`
- **Stato:** ⏳ aperta

### Decisione 4 — Mappatura badge qualità in GemPass
- **Cosa decidere:** colori per ogni `data_quality_flag`
  - `mancano_dati_obbligatori` → 🔴 rosso (CF MANCANTE — già attivo)
  - `tessera_mancante_da_assegnare` → 🟡 giallo
  - `omonimo_da_verificare` → 🔴 rosso
  - `da_verificare` → 🟠 arancio (24 tessere bonifica)
  - `incompleto` → ⚪ grigio
- **Stato:** ⏳ aperta — schema concordato, implementazione mancante

### Decisione 5 — Firma kiosk tablet
- **Stato:** ⏳ aperta — bassa priorità (Phase 2 lontana)

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1) — Fase 1 chiusa
- F1-001 → F1-007 — ✅ tutti chiusi (22/22 test)

### Frontend (F2) — Fase 1 chiusa
- F2-001 → F2-007 — ✅ tutti chiusi

### Fase 2 (UI fix)
- Non ancora iniziata. F1-008 / F2-008 saranno i prossimi.

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] **Bug UI campi che mostrano "—"** in GemPass:
   - `membership_type` (Tipo ente: ENDAS/OPES/LIBERTAS)
   - `issue_date` (Data emissione tessera)
   - `season_id` (Stagione)
   - `fee` (Quota tessera pagata)
   I dati sono già in DB ma la UI non li mostra. Va investigata
   la query/JSON di risposta API.
2. [ ] Creare tabella `membership_events` (storico azioni tessera)
3. [ ] Implementare bottone "Dati da verificare" (include 24 tessere bonifica)
4. [ ] Implementare funzione "Assegna Tessera" rapida per i 1.322 flaggati
5. [ ] Implementare badge qualità colorati in GemPass (5 colori)
6. [ ] (segreteria) Completare CF di 8 membri per sbloccare tesseramento:
   BELLONI, BOCCHETTI, BURANI, CIONI, GIACOSA, GULIZIA, MONTANI, MOUTIQ
7. [ ] (segreteria) Revisione delle 24 tessere create da bonifica
   (membership_type='ENDAS' di default — verificare se corretto)
8. [ ] (futura, bassa) Firma kiosk tablet Phase 2

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_22b_Bonifica** — ha creato 24 tessere e 8 flag CF mancante.
  Leggere RECAP_22b per dettaglio.
- **Chat_10_Utenti** — gestisce CF e flag qualità in anagrafica.
  Sinergia: la validazione CF real-time risolverà alla radice
  il problema degli 8 membri senza CF.
- **Chat_06_Contabilità** — `payments.membership_id` collega quote tessera.
  Modifiche allo schema memberships impattano payments.
- **Chat_02_GemStaff** — gli insegnanti hanno tessera obbligatoria.
  Coordinare se si introducono nuovi tipi di tessera.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **Formato tessera `2526-000042` (con trattino)** — NON modificare.
- **`memberships`** ha vincolo unicità `member_id + season_id`.
- **Flag qualità su 24 tessere bonifica**: `data_quality_flag='da_verificare'`,
  `membership_type='ENDAS'` di default.
- **CF Validator** disponibile in `shared/utils/cf-validator.ts`
  (creato da Chat_22b) — usabile per validazione real-time.
- **Smart Routing import attivo**: i nuovi import di QUOTATESSERA
  finiscono direttamente in memberships, non in enrollments.
- **API pubblica** `/api/public/membership-status/:code` non richiede auth.
- **8 senza CF**: il bottone "Crea Tessera" deve restare disabilitato
  con tooltip esplicativo.

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_Chat05_GemPass_2026_04_26_1800 + memoria progetto*
