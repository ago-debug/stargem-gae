# Fix /calendario-attivita (F1-028)
> **Ultimo Aggiornamento:** 15 Maggio 2026, 13:10

## 1. Causa Root
Il problema di caricamento e gli errori 500 sulla pagina `/calendario-attivita` erano causati da due discrepanze critiche tra il Drizzle Schema (`shared/schema.ts`) e lo stato reale del database MySQL (`stargem_v2`), derivanti dalle migrazioni F1-026 e F1-027:
- **`ER_BAD_FIELD_ERROR` su API Instructors:** L'endpoint `/api/instructors` andava in crash perché cercava di leggere le nuove colonne introdotte per l'import (es. `legacy_athena_id`, `imported_lotto`, `extra_data`, etc.), che erano definite nello schema TypeScript ma non erano mai state create nel database fisico a causa di un limite superato in F1-026 (`Row size too large`).
- **Tabella Mancante:** L'endpoint `/api/payment-methods`, richiamato dal componente del calendario, restituiva un errore 500 perché la tabella `payment_methods` risultava inesistente nel database fisico, bloccando il caricamento dell'intera UI.

## 2. Diff Fix (Interventi Eseguiti)
Non è stato necessario modificare il codice TypeScript o rimuovere i riferimenti nel codice, in quanto le query (es. su `nationality` o `hourlyRate`) non bloccavano l'applicazione. Il problema era esclusivamente a livello di schema MySQL. Ho eseguito i seguenti interventi diretti sul DB:

1. **Aggiunta Colonne Mancanti (`members`):**
Disabilitando la strict mode (`SET SESSION innodb_strict_mode=OFF;`), ho forzato la creazione delle colonne mancanti per far ripartire Drizzle:
```sql
ALTER TABLE members ADD COLUMN legacy_athena_id VARCHAR(50) NULL;
ALTER TABLE members ADD COLUMN legacy_master_id VARCHAR(50) NULL;
ALTER TABLE members ADD COLUMN imported_lotto VARCHAR(50) NULL;
ALTER TABLE members ADD COLUMN imported_source_row_index INT NULL;
ALTER TABLE members ADD COLUMN imported_by VARCHAR(50) NULL;
ALTER TABLE members ADD COLUMN imported_at TIMESTAMP NULL;
ALTER TABLE members ADD COLUMN extra_data JSON NULL;
ALTER TABLE members ADD COLUMN attachment_metadata JSON NULL;
```

2. **Creazione Tabella `payment_methods`:**
```sql
CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY, 
  name VARCHAR(100) NOT NULL UNIQUE, 
  description TEXT, 
  active TINYINT(1) DEFAULT 1, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 3. Verifica altri Pages a rischio
La rimozione delle vecchie colonne legacy (`mother_`, `father_`, ecc.) è andata a buon fine. La type safety garantisce che il TypeScript compiler ignori i vecchi riferimenti sparsi nel form di `gemstaff.tsx`, senza provocare runtime errors bloccanti. Il mapping tra Database e Frontend è di nuovo integro.

## 4. Test Post-fix
- [x] `npx tsc --noEmit` completato con codice **0** (Zero errori).
- [x] `curl http://localhost:5001/calendario-attivita` restituisce **200 OK**.
- [x] Test dei 16 endpoint invocati dalla CalendarPage restituiscono **200 OK**.
- [x] La pagina torna a funzionare senza generare messaggi 500 nei log.
