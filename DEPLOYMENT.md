# Guida al Deployment - Sistema Gestione Corsi

Questa guida spiega come installare e configurare l'applicazione su un server esterno.

## Requisiti di Sistema

- **Node.js** 18+ (raccomandato 20.x LTS)
- **PostgreSQL** 14+ 
- **npm** o **yarn**
- Almeno 1GB di RAM
- 2GB di spazio disco

## 1. Scaricare il Codice

Clona o scarica il repository del progetto sul tuo server.

```bash
git clone <url-repository>
cd <nome-cartella>
```

## 2. Installare le Dipendenze

```bash
npm install
```

## 3. Configurare il Database PostgreSQL

Crea un database PostgreSQL:

```sql
CREATE DATABASE gestione_corsi;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'password_sicura';
GRANT ALL PRIVILEGES ON DATABASE gestione_corsi TO app_user;
```

## 4. Configurare le Variabili d'Ambiente

Crea un file `.env` nella root del progetto con le seguenti variabili:

```env
# Database PostgreSQL
DATABASE_URL=postgresql://app_user:password_sicura@localhost:5432/gestione_corsi
PGHOST=localhost
PGPORT=5432
PGUSER=app_user
PGPASSWORD=password_sicura
PGDATABASE=gestione_corsi

# Sessione (genera una stringa random sicura)
SESSION_SECRET=genera_una_stringa_random_molto_lunga_e_sicura

# Produzione
NODE_ENV=production
PORT=5000
```

### Generare SESSION_SECRET

Puoi generare una stringa random sicura con:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 5. Inizializzare il Database

Esegui le migrazioni per creare le tabelle:

```bash
npm run db:push
```

## 6. Build dell'Applicazione

Compila l'applicazione per la produzione:

```bash
npm run build
```

## 7. Avviare l'Applicazione

Per avviare in produzione:

```bash
npm start
```

L'app sarà disponibile su `http://localhost:5000`

## 8. Configurazione con Process Manager (Raccomandato)

Per mantenere l'app in esecuzione e riavviarla automaticamente, usa PM2:

```bash
# Installa PM2 globalmente
npm install -g pm2

# Avvia l'app con PM2
pm2 start npm --name "gestione-corsi" -- start

# Salva la configurazione per il riavvio automatico
pm2 save
pm2 startup
```

### Comandi utili PM2:

```bash
pm2 status              # Stato dell'app
pm2 logs gestione-corsi # Visualizza i log
pm2 restart gestione-corsi # Riavvia l'app
pm2 stop gestione-corsi # Ferma l'app
```

## 9. Configurazione Nginx (Opzionale)

Per esporre l'app su porta 80/443 con un dominio:

```nginx
server {
    listen 80;
    server_name tuodominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Abilitare HTTPS con Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tuodominio.com
```

## 10. Importare i Dati Iniziali

Dopo aver avviato l'app, puoi importare i dati usando le funzionalità di import CSV presenti nell'interfaccia.

## Backup del Database

Per effettuare backup regolari:

```bash
pg_dump -U app_user -d gestione_corsi > backup_$(date +%Y%m%d).sql
```

Per ripristinare:

```bash
psql -U app_user -d gestione_corsi < backup_XXXXXXXX.sql
```

## Aggiornamenti

Per aggiornare l'applicazione:

```bash
# Scarica gli aggiornamenti
git pull

# Installa nuove dipendenze
npm install

# Ricompila
npm run build

# Applica eventuali modifiche al database
npm run db:push

# Riavvia l'app
pm2 restart gestione-corsi
```

## Risoluzione Problemi

### L'app non si avvia
- Verifica che PostgreSQL sia in esecuzione
- Controlla le credenziali nel file `.env`
- Verifica i log con `pm2 logs`

### Errori di connessione al database
- Assicurati che PostgreSQL accetti connessioni locali
- Verifica le impostazioni in `pg_hba.conf`

### Problemi di memoria
- Aumenta la RAM del server
- Configura Node.js con `--max-old-space-size=2048`

## Supporto

Per problemi tecnici, controlla i log dell'applicazione e del database.
