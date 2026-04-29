# CHECKLIST GLOBALE — StarGem Suite
## Aggiornata: 2026_04_26_1800
## Stato complessivo lavori Chat_22 → Chat_22b_Bonifica

---

## ✅ COMPLETATO

### IMPORT STORICO (Chat_22 — chiusa)
```
✅ members: 4.342 record importati
✅ memberships: 3.281 tessere StarGem pulite
   +24 create da bonifica = 3.305 totali
✅ enrollments: 13.584 iscrizioni
✅ payments: 3.775 pagamenti
✅ medical_certificates: 2.770 + 97 da bonifica
✅ courses: 586 corsi
✅ Pulizia: 147 Sconosciuto eliminati
✅ 342 tessere Athena duplicate rimosse
✅ Logica: MASTER > WORKSHOP > ATHENA > ElencoIscrizioni
✅ CF come chiave univoca assoluta
```

### EXPORT (Chat_22b)
```
✅ Date formato italiano GG/MM/AAAA
✅ Booleani → Sì/No
✅ Intestazione Excel coerente
✅ Anno 4 cifre nell'intestazione
✅ Orario Europe/Rome (TZ=Europe/Rome su VPS)
✅ Strong typing colonne ExportWizard
   (type: date/boolean/string/number)
✅ Streaming chunk 500 record /api/export
✅ Route legacy export-csv rimosse
✅ Tessera, pagamento, certificato in Maschera Input
✅ Certificato da medical_certificates
   (non dal campo legacy null)
✅ Verificato su 4 nominativi reali
```

### SANITIZZAZIONE DATI (Chat_22b)
```
✅ server/utils/sanitizer.ts creato
   UPPER: cognome, nome, CF, città, provincia,
          regione, nazionalità, luogo nascita
   LOWER: email, PEC, facebook, sito web
   TITLE CASE: indirizzo, professione,
               banca, tutori, emergenza
   Lettera maiuscola dopo cifra/slash (58A, 12/G)
✅ Integrato in 5 route + webhook WooCommerce
✅ Integrato in import /importa
✅ 3.949 record normalizzati retroattivamente
✅ street_address → address (12 file refactored)
   ghost column DB accettata (row size limit)
```

### SEZIONE /IMPORTA (Chat_22b)
```
✅ Dry-run con anteprima prima di eseguire
✅ Report CSV scaricabile post-import
✅ sanitizeMemberData applicato pre-insert/update
✅ Tracking modifiche_casing nel dry-run
✅ Colonna "Modifiche Applicate" nel report CSV
✅ Banner avviso normalizzazione step finale
✅ Smart Routing (Chat_22b Bonifica):
   QUOTATESSERA → memberships automatico
   DTYURI/DTNELLA → medical_certificates auto
   altri → enrollments con season_id forzato
✅ Validazione CF obbligatoria (blocco se mancante)
✅ CF invalido → blocco + warning dry-run
✅ CF valido ma incongruente → warning
✅ Blocco season_id NULL con conferma operatore
✅ Banner dry-run: rosso CF, arancio stagione,
   blu Smart Routing stats
```

### CF VALIDATOR (Chat_22b Bonifica)
```
✅ shared/utils/cf-validator.ts creato
   Algoritmo italiano checksum
   Estrae: data nascita, sesso, codici nome/cognome
   Usato nell'import
   Da collegare al form frontend (Chat_10)
```

### BONIFICA ENROLLMENTS (Chat_22b Bonifica)
```
✅ Audit 7.351 record activity_type=storico
✅ 24 tessere create (orfani QUOTATESSERA con CF)
✅ 8 membri senza CF: badge CRITICO in UI
   (members.tsx, anagrafica-home.tsx, gempass.tsx)
✅ 97 certificati medici creati (DTYURI/DTNELLA)
✅ 929 prove: season_id=1 assegnato
✅ 285 SKU riclassificati da storico
✅ 3 SKU lasciati storico (contenitori import)
✅ Allenamento 2526ALLENAMENTO → 'allenamenti'
```

### INFRASTRUTTURA
```
✅ TZ=Europe/Rome su VPS (.env + pm2)
✅ Backup system in /root/backups/
✅ Ultimo backup: CHAT22B_BONIFICA_20260426
✅ git push → stop, deploy manuale su Plesk
✅ Deploy script: scripts/deploy-vps.sh
```

---

## 🔴 IN CORSO / PROSSIMO

### Chat_05_GemPass (PROSSIMA)
```
⏳ Bug UI: membership_type, issue_date,
   season_id, fee mostrano "—"
⏳ Creare tabella membership_events
⏳ Bottone "Dati da verificare"
   (include 24 tessere da bonifica)
⏳ Funzione "Assegna Tessera"
⏳ Badge qualità colorati in GemPass
⏳ 8 membri senza CF da completare
   (CF va inserito in anagrafica prima)
⏳ Firma kiosk tablet (Phase 2 — bassa priorità)
```

### Chat_10_Utenti (dopo Chat_05)
```
⏳ Collegare cf-validator.ts al form
   (auto-compila nascita/sesso/luogo dal CF)
⏳ Validazione telefono real-time
⏳ Validazione email real-time
⏳ Verifica SMS OTP (auto-registrazione)
⏳ Mostrare 54+ campi nascosti in UI
⏳ Badge flag qualità (tessera_mancante,
   omonimo, mancano_dati, incompleto)
⏳ 179 persone non identificabili
   da completare manualmente
```

### Chat_06_Contabilità
```
⏳ ALTA PRIORITÀ: Rollback import pagamenti
   (transazione + "Annulla ultimo import")
⏳ Campi payments non visibili:
   operator_name, source, quota_description,
   period, total_quota, deposit,
   receipts_count, discount_*, gbrh_*
⏳ Sezione buoni regalo (2526GIFT — 21 iscrizioni)
```

### Chat_08_Corsi/Iscritti
```
⏳ Uniformare participation_type
   ('corso' vs 'STANDARD_COURSE')
⏳ Badge status iscrizione
   (active=verde, pending=giallo, cancelled=rosso)
⏳ Campi nascosti: source_file, notes, season_id
⏳ Filtri: per stagione, status, tipo partecipazione
⏳ Verificare OPEN* come abbonamenti corsi
```

---

## 📋 DA AVVIARE (chat ancora da aprire)

### Chat_09_Workshop
```
⏳ F1-001 audit prompt pronto
   (da eseguire — non ancora iniziato)
⏳ Workshop budget table mancante
⏳ sale_channel, operator_name mancanti
⏳ Guest enrollment (non-membri)
⏳ Attendance e status amministrativo
⏳ SKU WS* ora correttamente
   activity_type='workshop' (da bonifica)
⏳ CAMPUSS1/S2 → activity_type='campus'
```

### Chat_04_MedGem
```
⏳ RECAP pronto — F1-001 audit da eseguire
⏳ medical_certificates: 2.867 record
   (2.770 originali + 97 da bonifica)
⏳ Prenotazioni studio medico mensile
```

### Chat_07_Gemory
```
⏳ Architettura definita
⏳ 15 Trello board names da seedare come SQL
⏳ F1-001 da eseguire
```

### Chat_12_Gemdario
```
⏳ IN COLLAUDO — UI FREEZE
⏳ Raggruppamento corsi nel Planning sparito
⏳ Non toccare calendar.tsx, attivita.tsx
⏳ GemTeam E2E test con botAI
⏳ Overlay Programmazione Date nel shift grid
⏳ Festività italiane 2026 da completare
```

### Chat_13_Domeniche in Movimento
```
⏳ 19 corsi KUQI* ora domenica_movimento
⏳ F1-001 audit da eseguire
⏳ legacy sunday_activities deprecata
```

### Chat_01_Quote e Promo
```
⏳ Riaprire a F1-015/F2-012
⏳ StarGem→WooCommerce outbound sync
⏳ 3 decisioni architetturali aperte:
   price_list_items vs price_matrix
   staff promo code storage
   carnet deduction auto vs manuale
```

### Chat_14_BookGem
```
⏳ F1-001 audit prompt pronto
⏳ Da eseguire
```

### Chat_20_MerchSG
```
⏳ Solo merchandising_categories in DB
⏳ F1-001 audit da eseguire
```

### Chat_23_Log
```
⏳ Tabelle log già esistenti nel DB
   (audit_logs, access_logs, user_activity_logs)
⏳ UI visualizzazione da costruire
```

---

## 🔮 FUTURO

```
⏳ Delta import metà maggio
   (Smart Routing ora attivo — pronto)
⏳ P5 STAFF insegnanti
   (file STAFF__PERSONAL__ALTRI.xlsx)
⏳ Export PDF
⏳ StarGem→WooCommerce sync automatico
⏳ Clarissa CRM (sostituisce Bitrix)
⏳ GemTeam: assegnazione GemPass a 14 dipendenti
⏳ Verifica email (link conferma)
⏳ SMS OTP per auto-registrazione
```

---

## DEBITO TECNICO NOTO

```
⚠️ street_address ghost column in members
   (DROP impossibile per row size limit MariaDB)
⚠️ 8 membri senza CF (da completare manualmente)
⚠️ 179 persone non identificabili
⚠️ participation_type misto
   ('corso' + 'STANDARD_COURSE')
⚠️ 3 SKU storico (QUOTATESSERA/DTYURI/DTNELLA)
   lasciati come contenitori import — non toccare
```
