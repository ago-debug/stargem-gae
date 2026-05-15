# RECAP — Anagrafica: Fix UI Nuovi Campi
## StarGem Suite — Chat di Analisi
**Data sessione:** 2026-05-05
**Tipo chat:** Analisi + coordinamento (non ha numero proprio)
**Riferimento MASTER_STATUS:** 2026_04_24_1200
**Stato al termine della sessione:** 🟡 In attesa risposta F2-001 da AG-Frontend

---

## 1. CONTESTO DI PARTENZA

### Stato DB al momento della sessione
- `members`: **4.489 record** (importati da Athena tramite Chat_22)
- Import storico completato — 54+ nuovi campi aggiunti alla tabella `members`
- Campi visibili in UI al momento: **28** (solo quelli storici pre-import)
- Campi nascosti / non mostrati in UI: **54+** (tutti quelli importati da Athena)

### Problema da risolvere
Tutti i 54 nuovi campi esistono già nel DB (`members`) ma **non vengono né fetchati né mostrati in UI**. Il lavoro è **esclusivamente frontend** — non serve toccare il DB.

### File di riferimento letti in sessione
- `2026_04_24_1200_MASTER_STATUS.md`
- `D_2026_04_24_1144_Stato_DB_Reale.md`
- `D2_2026_04_24_1200_Stato_Mappa_Frontend.md`
- `B_2026_04_24_1151_Frontend_Moduli.md` (da Project Knowledge)
- `2026_04_20_1700_ANALISI_MASTER.md` (da Project Knowledge)

---

## 2. ELENCO COMPLETO CAMPI DA AGGIUNGERE ALL'UI

Tutti i campi qui sotto esistono già in `members` nel DB. Devono essere aggiunti all'interfaccia TypeScript, alla query API e all'UI.

### CONTATTI EXTRA
| Campo DB | Label UI suggerita |
|---|---|
| `mobile` | Cellulare |
| `secondary_email` | Email secondaria |
| `email_pec` | PEC |
| `whatsapp` | WhatsApp |

### INDIRIZZO
| Campo DB | Label UI suggerita |
|---|---|
| `address` | Via / Indirizzo |
| `city` | Città |
| `province` | Provincia |
| `postal_code` | CAP |
| `region` | Regione |

### DATI PERSONALI
| Campo DB | Label UI suggerita |
|---|---|
| `nationality` | Nazionalità |
| `birth_nation` | Nazione di nascita |
| `education_title` | Titolo di studio |
| `profession` | Professione |
| `residence_permit` | Permesso di soggiorno |
| `residence_permit_expiry` | Scadenza permesso soggiorno |

### TUTORI / MINORI
| Campo DB | Label UI suggerita |
|---|---|
| `tutor1_fiscal_code` | CF Tutore 1 |
| `tutor1_phone` | Telefono Tutore 1 |
| `tutor1_email` | Email Tutore 1 |
| `tutor1_birth_date` | Data nascita Tutore 1 |
| `tutor1_birth_place` | Luogo nascita Tutore 1 |

### CONSENSI GDPR
| Campo DB | Label UI suggerita |
|---|---|
| `consent_sms` | Consenso SMS |
| `consent_image` | Consenso immagini |
| `consent_newsletter` | Consenso newsletter |
| `consent_marketing` | Consenso marketing |
| `privacy_accepted` | Privacy accettata |
| `privacy_date` | Data accettazione privacy |

### DATI AZIENDA
| Campo DB | Label UI suggerita |
|---|---|
| `company_name` | Ragione sociale |
| `company_fiscal_code` | P.IVA / CF azienda |
| `company_address` | Indirizzo azienda |
| `company_city` | Città azienda |
| `company_phone` | Telefono azienda |
| `company_email` | Email azienda |

### DOCUMENTO
| Campo DB | Label UI suggerita |
|---|---|
| `document_type` | Tipo documento |
| `document_expiry` | Scadenza documento |
| `document_issued_by` | Rilasciato da |
| `document_issue_date` | Data rilascio |

### BANCA
| Campo DB | Label UI suggerita |
|---|---|
| `bank_name` | Banca |
| `iban` | IBAN |

### FISICI
| Campo DB | Label UI suggerita |
|---|---|
| `size_shirt` | Taglia maglia |
| `size_pants` | Taglia pantaloni |
| `size_shoes` | Taglia scarpe |
| `height` | Altezza (cm) |
| `weight` | Peso (kg) |

### CONTATTI EMERGENZA
| Campo DB | Label UI suggerita |
|---|---|
| `emergency_contact_1_name` | Contatto emergenza 1 — Nome |
| `emergency_contact_1_phone` | Contatto emergenza 1 — Telefono |
| `emergency_contact_1_email` | Contatto emergenza 1 — Email |
| `emergency_contact_2_name` | Contatto emergenza 2 — Nome |
| `emergency_contact_2_phone` | Contatto emergenza 2 — Telefono |
| `emergency_contact_2_email` | Contatto emergenza 2 — Email |

### ADMIN / OPERATIVI
| Campo DB | Label UI suggerita | Note |
|---|---|---|
| `fattura_fatta` | Fattura emessa | checkbox/boolean |
| `athena_id` | ID Athena (storico) | sola lettura |
| `from_where` | Come ci ha conosciuto | testo libero o select |

### FLAG CON BADGE COLORATO
| Campo DB | Valore | Badge |
|---|---|---|
| `data_quality_flag` | `tessera_mancante_da_assegnare` | 🟡 Giallo |
| `data_quality_flag` | `omonimo_da_verificare` | 🔴 Rosso |
| `data_quality_flag` | `mancano_dati_obbligatori` | 🟠 Arancio |
| `data_quality_flag` | `incompleto` | ⚪ Grigio |
| `data_quality_flag` | `NULL` | nessun badge |

**Distribuzione attuale dei flag nel DB:**
- NULL: 2.361
- `tessera_mancante_da_assegnare`: 1.322
- `omonimo_da_verificare`: 407
- `mancano_dati_obbligatori`: 198
- `nome_match`: 179
- `incompleto`: 20
- `creato_da_iscrizioni`: 2

---

## 3. ARCHITETTURA TECNICA NOTA

### File frontend coinvolti (candidati identificati da audit precedenti)
- `client/src/pages/members.tsx` — lista anagrafica (`/anagrafica`)
- `client/src/components/member-edit-dialog.tsx` — dialog edit membro
- Route `/membro/:id` — dashboard singolo membro (file da verificare)

### Struttura attuale UI (da B_2026_04_24_1151)
Il `member-edit-dialog.tsx` attualmente gestisce:
- Upload foto
- Nome, Cognome, Categoria, Tipo abbonamento, CF, Sesso, Nascita
- Contatti: Email, Cellulare, Telefono
- Indirizzo: Via, CAP, Città, Provincia, Stato
- Info Tessera: Associazione, Ente, Scad., Numero
- Minorenne checkbox (apre blocco Madre/Padre: Dati Base + Contatti)
- Flag Certificato Medico

### Campi visibili in `/anagrafica` (da D2_Mappa_Frontend)
| Campo DB | Mostrato |
|---|---|
| first_name | ✅ |
| last_name | ✅ |
| email | ✅ |
| mobile | ✅ |
| fiscal_code | ✅ |
| crm_profile_level | ✅ |
| data_quality_flag | ❌ nascosto, da sbloccare admin |
| season_id | ❌ solo logica filtro |
| created_at | ❌ |

### Regole inviolabili DB
- `payments` → MAI DROP, solo ADD COLUMN
- `members` → solo ADD COLUMN
- Backup DB obbligatorio dopo ogni F1 che tocca tabelle

---

## 4. PROTOCOLLI EMESSI IN QUESTA SESSIONE

### F2-PROTOCOLLO-001 — AUDIT (emesso, non ancora eseguito)
**Tipo:** Audit puro — zero modifiche
**Destinatario:** AG-F2 (Frontend)
**Obiettivo:** Mappare struttura attuale per pianificare inserimento dei 54 campi

**Contenuto del prompt inviato ad AG-F2:**

Il prompt chiedeva ad Antigravity di:

1. **Trovare i file coinvolti** — percorso, righe, scopo di ogni file che gestisce la scheda membro
2. **Mappare la struttura tab/sezioni attuale** — quante tab esistono, quali campi sono in ogni tab, se c'è accordion o card section
3. **Verificare l'interfaccia TypeScript Member** — se i 54 campi nuovi sono presenti o assenti nel tipo TS
4. **Verificare la query API** `GET /api/members/:id` — se usa SELECT * o colonne esplicite, quali dei 54 mancano
5. **Verificare badge data_quality_flag** — se esiste già logica visiva per i 4 valori flag

**Output atteso da AG-F2 (non ancora ricevuto):**
```
FILE COINVOLTI: [percorso — righe — scopo]
TAB/SEZIONI ATTUALI: [nome sezione → campi mostrati]
TIPO TS MEMBER: [percorso — campi presenti — campi assenti]
QUERY API /members/:id: [file:riga — SELECT* o esplicita — campi mancanti]
BADGE DATA_QUALITY_FLAG: [presente/assente — note]
DOMANDE: [eventuali ambiguità]
```

**STATO: 🔴 IN ATTESA — AG-F2 non ha ancora risposto**

---

## 5. DECISIONI ARCHITETTURALI PRESE

### Decisione 1 — È lavoro solo F2, non F1
I 54 campi esistono già nel DB. Non serve nessuna migrazione o ADD COLUMN. Il lavoro è:
- Aggiungere i campi all'interfaccia TypeScript `Member`
- Verificare/aggiornare la query `GET /api/members/:id` (possibilmente solo F1 per SELECT, se non usa già SELECT *)
- Aggiungere le sezioni UI nel componente di dettaglio/edit

### Decisione 2 — Sequenza protocolli prevista
```
F2-001 → AUDIT struttura attuale (emesso, attende risposta)
F2-002 → Modifica tipo TypeScript + aggiornamento query API (dopo audit)
F2-003 → Aggiunta sezioni UI per i nuovi campi (dopo F2-002)
F2-004 → Badge data_quality_flag (può procedere in parallelo o dopo)
```
Se la query API non usa SELECT *, potrebbe servire un F1-001 in parallelo per aggiornare la SELECT lato backend.

---

## 6. STATO FINALE SESSIONE

| Voce | Stato |
|---|---|
| Contesto letto e compreso | ✅ |
| Elenco 54 campi da aggiungere | ✅ documentato |
| F2-001 emesso | ✅ |
| Risposta AG-F2 ricevuta | 🔴 No |
| Modifiche al codice | 🔴 Nessuna |
| Modifiche al DB | 🔴 Nessuna (non necessarie) |

**Prossima azione al riapertura:**
Inviare F2-PROTOCOLLO-001 ad AG-F2 (il testo del prompt è nella sezione 4), attendere il report di audit, poi procedere con F2-002.

---

## 7. NOTE OPERATIVE

- **Questa chat non ha numero proprio** — è la chat di Analisi / coordinamento globale
- Il prompt F2-001 è pronto per essere copiato e inviato ad AG-F2 appena la chat viene riaperta
- Non serve alcun backup DB prima di procedere (nessuna modifica DB prevista)
- Se AG-F2 scopre che la query usa colonne esplicite e i 54 campi non ci sono, aprire F1-001 per aggiornare la SELECT backend
- Il badge `data_quality_flag` è prioritario perché supporta la bonifica dei 2.128 record con flag attivo

---

*RECAP generato il 2026-05-05 — Chat Analisi StarGem Suite*
*Prossimo file da aggiornare: MASTER_STATUS.md (sezione Anagrafica Fix UI)*
