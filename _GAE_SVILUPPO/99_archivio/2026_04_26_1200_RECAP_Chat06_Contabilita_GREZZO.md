# RECAP — Chat_06_Contabilità
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
- Smart Routing attivo: QUOTATESSERA e visite
  mediche non finiscono più in enrollments
- 2526GIFT classificato come 'buono_regalo'
  (21 iscrizioni) — da gestire come sezione
  dedicata buoni regalo
- Rollback import pagamenti ancora mancante
  (ALTA PRIORITÀ — vedi sotto)
- ExportWizard con strong typing attivo
- sanitizer.ts attivo su tutti i salvataggi
- TZ=Europe/Rome su VPS
```

---

## PENDENTI PRIORITÀ ALTA

```
1. ROLLBACK IMPORT PAGAMENTI (ALTA)
   Problema: import massivo di pagamenti
   sbagliati non è reversibile.
   Da implementare:
   - Transazione DB con BEGIN/COMMIT
     su ogni import pagamenti
   - Funzione "Annulla ultimo import"
     con ROLLBACK dell'ultimo batch
     (identificato da import_batch_id
      o timestamp)
   - Finestra temporale: es. 30 minuti
   NOTA: pagamenti non si droppano mai.
   Usare soft-delete o flag annullato,
   mai DELETE fisico.

2. CAMPI PAYMENTS NON VISIBILI IN UI
   Importati ma non mostrati:
   - operator_name → chi ha inserito
   - source → canale/sede di vendita
   - transfer_confirmation_date → data
     entrata sul conto
   - quota_description → descrizione
     (es. "2 CORSI ADULTI, 1 QUOTA TESSERA")
   - period → periodo (es. "SET-OTT 2025")
   - total_quota → totale quota lorda
   - deposit → acconto versato
   - receipts_count → numero ricevute
   - discount_code → codice sconto
   - discount_value → valore sconto
   - gbrh_numero/date/iban → buoni gift

3. SEZIONE BUONI REGALO
   2526GIFT: 21 iscrizioni classificate
   come 'buono_regalo' in courses.
   Da creare UI dedicata per gestione
   buoni regalo (emissione, utilizzo,
   scadenza).
```

---

## REGOLE OPERATIVE
```
F1 = AG-Backend · F2 = AG-Frontend
Protocolli: F1-001 / F2-001

Flusso: audit → analisi → VAI
Ogni risposta indica: "Risposta F1-PROTOCOLLO-001"
Ogni protocollo in un unico blocco copia-incolla.

payments → MAI DROP, solo ADD COLUMN
Backup obbligatorio prima di ogni F1 su DB.
Deploy: git push → stop, Gaetano deploya su Plesk.
```

---

## COME APRIRE LA CHAT
```
Sei Claude coordinatore StarGem Suite.
Questa è Chat_06_Contabilità.

Leggi dal Progetto Claude:
- 2026_04_26_1800_MASTER_STATUS.md
- D_2026_04_25_1215_Stato_DB_Reale.md

PRIORITÀ:
1. Rollback import pagamenti (ALTA)
2. Campi payments non visibili in UI
3. Sezione buoni regalo (2526GIFT)

Dev: localhost:5001
DB: stargem_v2 porta 3307
```
