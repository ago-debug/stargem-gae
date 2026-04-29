# RECAP — Chat_10_Utenti/Anagrafica
## Aggiornato: 2026_04_26_1800

---

## LEGGI PRIMA DI TUTTO
```
Dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md
- D2_2026_04_25_1215_Stato_Mappa_Frontend.md
```

---

## NOVITÀ DA CHAT_22b/BONIFICA

```
SANITIZZAZIONE AUTOMATICA (già in produzione):
  server/utils/sanitizer.ts attivo su:
  - POST/PATCH /api/members
  - maschera-generale/save
  - import-google-sheets
  - webhook WooCommerce
  - import /importa

  Regole attive:
  UPPER: cognome, nome, CF, città, provincia,
         regione, nazionalità, luogo nascita
  LOWER: email, PEC, facebook, sito web
  TITLE CASE: indirizzo, professione,
              banca, tutori, emergenza
  Lettera maiuscola dopo cifra/slash (58A, 12/G)

CF VALIDATOR (già in produzione):
  shared/utils/cf-validator.ts
  - Checksum algoritmo italiano
  - Estrae: data nascita, sesso, codici
  - Usato nell'import — da collegare
    al form frontend in tempo reale

8 MEMBRI CON CF MANCANTE:
  BELLONI HELLEN, BOCCHETTI MALTSEVA,
  BURANI SARA, CIONI BIANCA,
  GIACOSA CHIARA, GULIZIA GABRIELE,
  MONTANI FRANCESCA, MOUTIQ JAMILIA
  data_quality_flag = 'mancano_dati_obbligatori'
  → CF va inserito manualmente in anagrafica

NORMALIZZAZIONE RETROATTIVA:
  3.949 record normalizzati (già fatto)
  street_address → address (ghost column nel DB)
```

---

## PENDENTI PRIORITÀ

```
1. VALIDAZIONE CF IN TEMPO REALE (frontend)
   cf-validator.ts già esiste in shared/utils/
   Da collegare al form anagrafica:
   - Quando CF viene inserito: valida subito
   - Se invalido: errore rosso immediato
   - Se valido: auto-compila data nascita,
     sesso, luogo nascita (dal codice Belfiore)
   - Se incongruente con nome/cognome: warning

2. VALIDAZIONE TELEFONO
   Formato italiano o internazionale.
   Segnalazione in tempo reale.

3. VALIDAZIONE EMAIL
   Formato corretto in real-time.
   In futuro: verifica via link conferma.

4. VERIFICA SMS (OTP)
   Per auto-registrazione utenti.
   Non obbligatoria per inserimento da team.

5. 54+ CAMPI NASCOSTI IN UI
   Importati ma non mostrati:
   mobile, secondary_email, email_pec
   address, city, province, postal_code
   nationality, birth_nation
   tutor1_*, tutor2_*
   consent_sms, consent_image,
   consent_newsletter, privacy_*
   company_name, company_fiscal_code
   document_type, document_expiry
   bank_name, iban
   size_shirt, size_pants, size_shoes,
   height, weight
   emergency_contact_1/2/3
   education_title, education_institute
   fattura_fatta, athena_id, from_where
   p_iva, albo_*, patente_*, car_plate

6. BADGE FLAG QUALITÀ
   tessera_mancante_da_assegnare → 🟡
   omonimo_da_verificare → 🔴
   mancano_dati_obbligatori → 🔴 (già attivo)
   da_verificare → 🟠
   incompleto → ⚪

7. 179 PERSONE NON IDENTIFICABILI
   Persone reali da completare manualmente.
   Da gestire con workflow dedicato.
```

---

## REGOLE OPERATIVE
```
F1 = AG-Backend · F2 = AG-Frontend
Protocolli: F1-001 / F2-001

Flusso obbligatorio:
1. Claude chiede ad Antigravity di analizzare
2. Antigravity risponde con analisi e proposta
3. Claude valuta con Gaetano
4. Solo dopo → VAI
5. Il codice lo scrive sempre Antigravity

Ogni risposta indica: "Risposta F1-PROTOCOLLO-001"
Ogni protocollo in un unico blocco copia-incolla.

members → solo ADD COLUMN (mai modificare esistenti)
Backup obbligatorio prima di ogni F1 su DB.
Deploy: git push → stop, Gaetano deploya su Plesk.
```

---

## COME APRIRE LA CHAT
```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_10_Utenti/Anagrafica.

Leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md

PRIORITÀ:
1. Collegare cf-validator.ts al form
   (già esiste in shared/utils/)
   Auto-compila nascita, sesso, luogo dal CF
2. Validazione telefono ed email real-time
3. Mostrare 54+ campi nascosti in UI
4. Badge flag qualità

ATTENZIONE:
- sanitizer.ts già attivo su tutti i salvataggi
- 8 membri con CF mancante già flaggati
- street_address è ghost column nel DB —
  usare sempre 'address'

Dev: localhost:5001
DB: stargem_v2 porta 3307
```
