---
aggiornato: 2026-05-12T00:18
ultima_verifica_vs_codice: 2026-05-12T00:18
validita_prevista: 14 giorni
fonti_verificate: [codebase server/, shared/schema.ts, DB stargem_v2]
---

# Audit F1-002: Anagrafica Approfondito (Members)

Questo documento traccia in modo chirurgico lo stato reale del monolite `members` e dei moduli periferici (tessere, certificati), rispondendo in modo puntuale alle domande di refactoring.

## A. Schema `members` per famiglie (170+ colonne)

L'analisi di `shared/schema.ts` rivela le seguenti macro-famiglie di colonne piatte, attualmente ospitate tutte in `members`:

1. **Anagrafica Base**: `id`, `firstName`, `lastName`, `fiscalCode`, `dateOfBirth`, `placeOfBirth`, `birthProvince`, `birthNation`, `gender`, `nationality`, `region`, `active`
2. **Contatti**: `email`, `secondaryEmail`, `phone`, `mobile`, `whatsapp`, `emailPec`
3. **Residenza**: `address`, `city`, `province`, `postalCode`, `country`
4. **Tutori (Minori)**: `tutor1FirstName`, `tutor1LastName`, `tutor1FiscalCode`, `tutor1Phone`, `tutor1Email`, `tutor1BirthDate`, `tutor1BirthPlace` (e analoghi per `tutor2`), `isMinor`, `mother...` (interi set per madre e padre).
5. **Consensi e Privacy**: `privacyAccepted`, `regulationsAccepted`, `membershipApplicationSigned`, `consentSms`, `consentCertificate`, `consentModule`, `consentImage`, `consentMarketing`, `consentNewsletter`, `privacyDate`
6. **Azienda**: `companyName`, `companyFiscalCode`, `companyAddress`, `companyCap`, `companyCity`, `companyProvince`, `companyPhone`, `companyEmail`, `pIva`
7. **Documenti**: `documentIssuedBy`, `documentIssueDate`, `documentType`, `documentExpiry`, `residencePermit`, `residencePermitExpiry`
8. **Misure e Taglie**: `sizeShirt`, `sizePants`, `sizeShoes`, `height`, `weight`
9. **Emergenza**: `emergencyContact1Name`, `...Phone`, `...Email` (replicato per contatti 2 e 3)
10. **Athena/Legacy (es. Colonna A e BA)**: `athenaId`, `internalId`, `athenaMemberType`, `athenaGroup`, `sedeRiferimento`, `firstEnrollmentDate`, `codiceCatastale`, `mastroC`, `mastroCol`, `codiceFe`, `fromWhere`, `teamSegreteria`, `dataQualityFlag`, `notes`, `adminNotes`.
11. **Tessere [O-U] (Debito Tecnico)**: `cardNumber`, `cardIssueDate`, `cardExpiryDate`, `entityCardType`, `entityCardNumber`, `entityCardIssueDate`, `entityCardExpiryDate`, `previousMembershipNumber`
12. **Certificati [V-W] (Debito Tecnico)**: `hasMedicalCertificate`, `medicalCertificateExpiry`
13. **Insegnanti/Staff**: `specialization`, `bio`, `hourlyRate`, `staffStatus`, `lezioniPrivateAutorizzate`
14. **CRM Profiling**: `crmProfileLevel`, `crmProfileScore`, `crmProfileOverride`, `crmProfileReason`

## B. FK in entrata su `members.id`

La query su `information_schema` ha rivelato **27 constraint** di Foreign Key (Delete Rule: Cascade / Set Null gestiti da Drizzle). Le più impattanti:
- `enrollments.member_id`
- `payments.member_id`
- `memberships.member_id`
- `medical_certificates.member_id`
- `team_employees.member_id`
- `staff_presenze.member_id` e `staff_sostituzioni`
- `attendances.member_id`
- `access_logs.member_id`
- `carnet_wallets.member_id`
- `member_relationships` (self-referencing)

*Rischio Refactor*: Altissimo. Modificare `members.id` o i delete comportamentali cancella l'intero ecosistema del gestionale.

## C. Route che leggono tessere/certificati DA members (debito)

Il grep evidenzia dove il codice si aspetta di trovare le tessere nelle colonne piatte di `members`, creando "dual-write" e inconsistenze:
- `server/routes.ts:7769-7772`: La generazione dei report esporta `members.cardNumber` e `members.hasMedicalCertificate`.
- `server/routes.ts:8054-8074`: I filtri avanzati della vista `/api/members` (`dateOfBirth`, `medicalCertificateExpiry`, `isMinor`) si appoggiano ai campi piatti anziché alle join.
- `server/storage.ts`: Molteplici punti (es. righe `1677`, `3272`, `3324`, `3383`) contengono logiche ibride dove `updateMember` cerca di sincronizzare le colonne piatte `cardNumber` e `hasMedicalCertificate` basandosi sui dati inseriti nei form, simulando una relazione relazionale fallace.

## D. Route già "pulite" su memberships / medical_certificates

- `/api/memberships`: Route dedicata per GET e gestione tessere, perfettamente funzionante e slegata dal monolite.
- `/api/medical-certificates`: Route per il CRUD dei certificati medici.
- `server/routes.ts:8345-8397`: Lo "Smart Routing" nell'importazione scrive correttamente sulle tabelle relazionali senza toccare `members`.

## E. Schema `memberships`

Struttura autonoma pulita:
- FK: `memberId` (`CASCADE`)
- Vincoli: `membershipNumber` (Unique), `barcode` (Unique)
- Dati tesseramento: `issueDate`, `expiryDate`, `status` ('active', 'expired', 'suspended'), `fee`, `membershipType` ('NUOVO', 'RINNOVO').
- Competenza: `seasonCompetence`, `seasonStartYear`, `seasonEndYear`, `seasonId` (FK su `seasons`).
- Ente Esterno: `entityCardNumber`, `entityCardExpiryDate`.

## F. Schema `medical_certificates`

Struttura autonoma pulita:
- FK: `memberId` (`CASCADE`)
- Dati validità: `issueDate`, `expiryDate`.
- Stato: `status` ('valid', 'expired', 'pending').
- Metadati: `doctorName`, `notes`.

## G. Smart Routing import

L'analisi di `server/routes.ts` (righe 8345+) mostra che il parser dell'import storico GSheet esegue un "routing intelligente":
1. Se lo SKU contiene **`QUOTATESSERA`**: non crea un'iscrizione (enrollment) ma inietta un record direttamente nella tabella relazionale `memberships` con `seasonId: 1`.
2. Se lo SKU contiene **`DTYURI`** o **`DTNELLA`**: inietta un record direttamente nella tabella `medical_certificates` calcolando la scadenza `+1 anno` dalla data di iscrizione.

## H. Migrazioni recenti su `members` (Ultimi 60 giorni)

Lo schema di `members` è stato modificato in 5 ondate tra Febbraio e Aprile:
- `0001`: Aggiunti campi madre/padre, `athena_id` e 20+ campi legacy (il grande dump iniziale).
- `0003`: Aggiunti campi consenso privacy e campi da insegnante (`hourly_rate`, `specialization`).
- `0004`: Aggiunti i 4 campi JSON `*_metadata` (attachment, gift, tessere, certificato).
- `0006`: Aggiunti i campi CRM (`crm_profile_level`, `crm_profile_score`, ecc.).
- `0008`: Droppata la foreign key obsoleta `cli_cats_id_fk`.

Nessuna migrazione recente ha cercato di rimuovere le colonne tessere/certificati; si è solo aggiunto peso.

## I. Risposte aggiornate alle 4 domande di Gaetano

1. **Colonne O-U sono tessere?** **SÌ.** Nel mapping dell'import e nello schema Drizzle esistono esattamente 8 colonne storiche (`cardNumber`...`entityCardExpiryDate` + `previousMembershipNumber`) che rappresentano il blocco tessere piattato.
2. **Colonne V-W sono certificati?** **SÌ.** Mappano perfettamente con `hasMedicalCertificate` e `medicalCertificateExpiry`.
3. **Colonna A è l'id legacy?** **SÌ.** Viene mappata su `athenaId` e `internalId`.
4. **Colonna BA è droppabile?** **SÌ.** Campi come `gsheetChiScrive`, `mastroC`, `mastroCol`, `codiceFe`, `gsheetVendita` sono detriti storici del foglio Excel non più usati dal sistema gestionale Drizzle/React. Possono essere rimossi con una migrazione distruttiva per alleggerire la select su `members`.

---

## SINTESI E PROPOSTA PIANO REFACTOR

Lo stato di "dual-write" (codice che scrive la tessera sia in `memberships` sia nelle colonne piatte di `members`) è il debito tecnico più pericoloso dell'intero gestionale.

**Piano in 3 step (Stima: 2 giorni pieni)**

**Fase 1: Taglio letture (Backend)**
- Modificare tutte le GET in `routes.ts` (inclusi i report export) per non pescare `members.cardNumber` ma estrarlo tramite una `LEFT JOIN memberships` (restituendo la tessera attiva). Stessa cosa per i certificati medici.
- *Rischio*: Basso se confinato ai report.

**Fase 2: Taglio scritture (Backend)**
- Pulire `storage.ts` eliminando le righe che aggiornano `members.cardNumber` e `members.hasMedicalCertificate`. Da oggi in poi, si scrive ESCLUSIVAMENTE sulle tabelle dedicate.
- *Rischio*: Medio (la UI React Form potrebbe aspettarsi risposte piatte).

**Fase 3: Drop Colonne (Migrazione DB)**
- Eseguire script `drizzle-kit generate` e applicare la migrazione SQL che droppa le colonne: `cardNumber`, `cardIssueDate`, `cardExpiryDate`, `entityCardType`, `entityCardNumber`, `entityCardIssueDate`, `entityCardExpiryDate`, `hasMedicalCertificate`, `medicalCertificateExpiry` + campi legacy Athena/Gsheet.
- *Rischio*: Alto. Point of no return. Prima si esegue il reimport completo di GemTeam/Pagamenti, poi si esegue il drop.
