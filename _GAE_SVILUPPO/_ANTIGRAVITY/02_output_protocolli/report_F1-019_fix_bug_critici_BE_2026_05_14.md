# Report Risoluzione Bug: Backend MC1+MC2+MC3 (F1-019)

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:34

Tutti i 3 Bug Critici emersi nella verifica F1-018 sono stati presi in carico ed eliminati tramite patching diretto al Database e al Backend, preservando la business logic.

## Dettaglio Interventi

### 1. Fix Schema DB (`members.attachments_url`)
- **Azione Effettuata:** Poiché la tabella `members` non possedeva il column `attachments_url`, e il Drizzle Schema mappava questo campo, la compilazione di API (`/api/dossiers`) andava in 500 cercando di leggerlo.
- **Soluzione:** È stata lanciata una query SQL di alterazione: `ALTER TABLE members CHANGE attachment_metadata attachments_url JSON`.
- **Esito:** Il vecchio campo legacy è stato rinominato in conformità al nuovo design senza alterare la riga massima limitata da InnoDB, abilitando nuovamente con successo le chiamate alle routes.
- **Extra:** Nello stesso perimetro, sono stati patchati `createdBy` in dossiers e `performedBy` in dossier audit log da `int` a `varchar(255)`, risolvendo i blocchi NaN causati dall'`admin-id` alfanumerico.

### 2. Fix MC3 payload mismatch (Snake vs CamelCase)
- **Azione Effettuata:** Drizzle ORM rifiutava gli insert in `external_payers` e `societies` poiché i controller passavano il payload spreadato in *snake_case* anziché rispettare il property name in *camelCase*.
- **Soluzione:** Nei controller `server/routes/mc3_pagamenti.ts` ho riscritto le chiamate `.values(data)` mappando esplicitamente campo per campo (es. `businessName: req.body.business_name`).
- **Esito:** Entrambe le chiamate HTTP passano il payload creando i record in DB con status 201.

### 3. Aggiunta `/api/health`
- **Azione Effettuata:** La route `health` non esisteva, risultando intercettata in 404 dal dev server Vite.
- **Soluzione:** Aggiunto un middleware specifico `app.get("/api/health")` in `server/routes.ts` prima del return per intercettare l'health check ed evitare overhead React.
- **Esito:** Risponde status 200 restituendo il timestamp UTC in JSON.

---

## Esito Test Finali
- **`npx tsc --noEmit`**: Compilato senza errori (Exit code 0). I tipi Drizzle sono sicuri.
- **CURL Dossiers**: ✅ 200/201
- **CURL External Payers**: ✅ 201
- **CURL Health**: ✅ 200

Il Backend entra in stato di stabilità operativa (Ready for UI).
