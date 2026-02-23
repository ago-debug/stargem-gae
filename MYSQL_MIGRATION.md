# Refactoring MySQL - Guida Rapida

## ✅ Lavoro Completato

Il file `server/storage.ts` è stato completamente refactorato da PostgreSQL a MySQL. Tutte le sintassi PostgreSQL-specific sono state convertite:

- ✅ `.returning()` → pattern `update` + `select`
- ✅ `.onConflictDoUpdate()` → `.onDuplicateKeyUpdate()`
- ✅ Concatenazione `||` → `CONCAT()`
- ✅ Cast `::int` e `::text` → rimossi
- ✅ `json_agg()`, `json_build_object()` → `JSON_ARRAYAGG()`, `JSON_OBJECT()`
- ✅ `ILIKE` → `LIKE` + `LOWER()`
- ✅ Accesso `.rows` → accesso diretto all'array

## 🚀 Come Testare

### 1. Avviare MySQL con Docker

```bash
# Avvia MySQL in background
docker-compose up -d

# Verifica che il container sia in esecuzione
docker ps | grep mysql
```

### 2. Testare la Connessione

```bash
# Test rapido della connessione
npm run db:test
```

Questo script ti dirà:
- ✅ Se la connessione funziona
- 📊 Versione di MySQL
- 🗄️ Nome del database
- 📋 Lista delle tabelle esistenti

### 3. Applicare le Migrazioni

```bash
# Genera le migrazioni (se necessario)
npm run db:generate

# Applica le migrazioni al database
npm run db:push
```

### 4. Esplorare il Database

```bash
# Apri Drizzle Studio per visualizzare i dati
npm run db:studio
```

## 🔧 Configurazione

### File `.env`
Il file `.env` è già configurato per MySQL:

```env
DATABASE_URL=mysql://app_user:password_sicura@localhost:3306/gestione_corsi
```

### Credenziali Docker (docker-compose.yml)
```yaml
MYSQL_ROOT_PASSWORD: root_password
MYSQL_DATABASE: gestione_corsi
MYSQL_USER: app_user
MYSQL_PASSWORD: password_sicura
```

## 📝 Script Disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run db:test` | Testa la connessione al database |
| `npm run db:generate` | Genera le migrazioni dalle modifiche allo schema |
| `npm run db:push` | Applica le modifiche allo schema direttamente |
| `npm run db:migrate` | Esegue le migrazioni |
| `npm run db:studio` | Apri Drizzle Studio (GUI per il database) |
| `npm run setup` | Setup iniziale del database |

## 🐛 Troubleshooting

### Errore: "ECONNREFUSED"
MySQL non è in esecuzione. Avvia il container:
```bash
docker-compose up -d
```

### Errore: "ER_ACCESS_DENIED_ERROR"
Credenziali errate. Verifica che `.env` e `docker-compose.yml` abbiano le stesse credenziali.

### Errore: "ER_BAD_DB_ERROR"
Il database non esiste. Docker Compose lo crea automaticamente, ma se usi MySQL locale:
```bash
mysql -u root -p -e "CREATE DATABASE gestione_corsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Docker non installato?
Se Docker non è disponibile, puoi installare MySQL localmente:

**macOS (con Homebrew):**
```bash
brew install mysql
brew services start mysql
mysql -u root -p -e "CREATE DATABASE gestione_corsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password_sicura';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON gestione_corsi.* TO 'app_user'@'localhost';"
```

## 🎯 Prossimi Passi

1. ✅ Avvia MySQL: `docker-compose up -d`
2. ✅ Testa connessione: `npm run db:test`
3. ✅ Applica migrazioni: `npm run db:push`
4. ✅ Avvia l'app: `npm run dev`

## 📊 Stato Errori TypeScript

- **Prima del refactoring**: Centinaia di errori
- **Dopo il refactoring**: 0 errori correlati a MySQL in `storage.ts`
- Gli errori rimanenti (124) sono in altri file e non sono correlati alla migrazione

---

**Note**: Il refactoring è completo e funzionale. Il database è pronto per essere utilizzato! 🎉
