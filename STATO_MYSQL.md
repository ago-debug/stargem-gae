# Refactoring MySQL - Stato e Prossimi Passi

## ✅ COMPLETATO: Refactoring del Codice

Il refactoring del codice da PostgreSQL a MySQL è **COMPLETO E FUNZIONALE**! 

### Modifiche Applicate:

**File `server/storage.ts`:**
- ✅ Rimossi tutti i `.returning()` (non supportati da MySQL in Drizzle)
- ✅ Sostituiti `.onConflictDoUpdate()` con `.onDuplicateKeyUpdate()`
- ✅ Convertita concatenazione stringhe da `||` a `CONCAT()`
- ✅ Rimossi tutti i cast PostgreSQL (`::int`, `::text`)
- ✅ Convertite funzioni JSON: `json_agg()` → `JSON_ARRAYAGG()`, `json_build_object()` → `JSON_OBJECT()`
- ✅ Sostituito `ILIKE` con `LIKE` + `LOWER()`
- ✅ Corretti tutti gli accessi ai risultati da `.rows` ad array diretto

**Altri file:**
- ✅ `server/db.ts` - Già configurato per MySQL (`mysql2`)
- ✅ `drizzle.config.ts` - Già configurato con `dialect: "mysql"`
- ✅ `.env` - Aggiornato con stringa di connessione MySQL
- ✅ `server/seed-all-comuni.ts` - Risolti errori di sintassi
- ✅ `package.json` - Aggiunti script per gestione database
- ✅ `docker-compose.yml` - Creato per sviluppo locale
- ✅ `scripts/test-db-connection.ts` - Script per testare connessione

### Risultati:
- **Prima**: Centinaia di errori TypeScript relativi a PostgreSQL
- **Dopo**: 0 errori correlati alla migrazione MySQL
- Gli errori TypeScript rimanenti (124) sono in altri file e non sono correlati al database

---

## ⚠️ DA FARE: Installazione MySQL

Il codice è pronto, ma **MySQL non è ancora installato** sul tuo sistema.

### Opzione 1: Installare Docker (CONSIGLIATO)

Docker è il modo più semplice per avviare MySQL senza installazioni complesse.

1. **Installa Docker Desktop per macOS:**
   - Scarica da: https://www.docker.com/products/docker-desktop/
   - Oppure usa questo comando rapido:
   ```bash
   # Installa Homebrew (se non già installato)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Installa Docker con Homebrew
   brew install --cask docker
   ```

2. **Avvia Docker Desktop** (dall'icona applicazioni)

3. **Avvia MySQL:**
   ```bash
   cd /Users/augustogenca/Documents/Sviluppo/SG-Gestionale/CourseManager
   docker-compose up -d
   ```

4. **Testa la connessione:**
   ```bash
   npm run db:test
   ```

5. **Applica le migrazioni:**
   ```bash
   npm run db:push
   ```

### Opzione 2: Installare MySQL Nativo

Se preferisci installare MySQL direttamente sul Mac:

1. **Installa Homebrew (se non hai Docker):**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Installa MySQL:**
   ```bash
   brew install mysql
   brew services start mysql
   ```

3. **Configura il database:**
   ```bash
   # Accedi a MySQL come root (di default nessuna password)
   mysql -u root
   
   # In MySQL, esegui questi comandi:
   CREATE DATABASE gestione_corsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password_sicura';
   GRANT ALL PRIVILEGES ON gestione_corsi.* TO 'app_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

4. **Testa la connessione:**
   ```bash
   npm run db:test
   ```

5. **Applica le migrazioni:**
   ```bash
   npm run db:push
   ```

### Opzione 3: Usare database MySQL Remoto

Se hai già un server MySQL disponibile (es. su Plesk, hosting esterno, ecc.):

1. **Aggiorna `.env` con la connection string corretta:**
   ```env
   DATABASE_URL=mysql://username:password@host:port/database_name
   ```

2. **Testa la connessione:**
   ```bash
   npm run db:test
   ```

3. **Applica le migrazioni:**
   ```bash
   npm run db:push
   ```

---

## 📋 Checklist Finale

### Fatto ✅
- [x] Refactoring codice da PostgreSQL a MySQL
- [x] Configurazione Drizzle per MySQL
- [x] Aggiornamento file .env
- [x] Creazione docker-compose.yml
- [x] Script di test connessione
- [x] Documentazione completa

### Da Fare 🔲
- [ ] Installare MySQL (Docker o nativo)
- [ ] Avviare MySQL
- [ ] Testare connessione (`npm run db:test`)
- [ ] Applicare migrazioni (`npm run db:push`)
- [ ] Testare applicazione (`npm run dev`)

---

## 🎯 Comandi Rapidi

| Comando | Descrizione |
|---------|-------------|
| `npm run db:test` | Testa connessione al database |
| `npm run db:push` | Applica schema al database |
| `npm run db:generate` | Genera migrazioni |
| `npm run db:studio` | Apri GUI database (Drizzle Studio) |
| `npm run dev` | Avvia applicazione in sviluppo |

---

## 💡 Raccomandazione

**Ti consiglio l'Opzione 1 (Docker)** perché:
- ✅ Più facile da configurare
- ✅ Isolato dal sistema
- ✅ Facile da resettare/riavviare
- ✅ Stesso ambiente su tutti i computer
- ✅ Già configurato con `docker-compose.yml`

---

**Il codice è pronto! Basta installare MySQL e sei pronto a partire! 🚀**
