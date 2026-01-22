# Guida Deploy su VPS con Plesk

## Prerequisiti sul Server

### 1. Installare Node.js
In Plesk, vai su **Extensions** e installa l'estensione **Node.js**.
Assicurati di avere Node.js versione 20 o superiore.

### 2. Creare Database PostgreSQL
In Plesk:
1. Vai su **Databases**
2. Clicca **Add Database**
3. Scegli **PostgreSQL**
4. Annota: nome database, utente e password

---

## Preparazione del Codice

### 1. Scarica il progetto
Su Replit, clicca i tre puntini nel pannello file e seleziona **Download as zip**.

### 2. Carica sul server
Usa FTP/SFTP per caricare i file nella cartella del dominio (es. `/var/www/vhosts/tuodominio.com/httpdocs/`).

---

## Configurazione sul Server

### 1. Crea il file `.env`
Nella root del progetto, crea un file `.env`:

```env
NODE_ENV=production
DATABASE_URL=postgresql://UTENTE:PASSWORD@localhost:5432/NOME_DATABASE
SESSION_SECRET=genera_una_stringa_casuale_lunga_almeno_32_caratteri
ADMIN_EMAIL=tuaemail@esempio.com
ADMIN_PASSWORD=la_tua_password_sicura
```

Sostituisci:
- `UTENTE` con l'utente del database PostgreSQL
- `PASSWORD` con la password del database PostgreSQL
- `NOME_DATABASE` con il nome del database
- `ADMIN_EMAIL` con l'email per accedere all'app
- `ADMIN_PASSWORD` con la password per accedere all'app

### 2. Installa le dipendenze
Via SSH, vai nella cartella del progetto e esegui:

```bash
npm install
```

### 3. Compila l'applicazione
```bash
npm run build
```

### 4. Inizializza il database
```bash
npm run db:push
```

### 5. Avvia l'applicazione (test)
```bash
NODE_ENV=production node dist/index.js
```

L'app dovrebbe avviarsi sulla porta 5000.

---

## Configurazione Plesk Node.js

### 1. Attiva Node.js per il dominio
1. In Plesk, vai al tuo dominio
2. Clicca su **Node.js**
3. Configura:
   - **Document Root**: `/httpdocs` (o la cartella dove hai caricato i file)
   - **Application Mode**: Production
   - **Application Startup File**: `dist/index.js`
   - **Node.js Version**: 20.x

### 2. Configura le variabili d'ambiente
Nella sezione Node.js di Plesk, aggiungi le variabili:
- `NODE_ENV` = `production`
- `DATABASE_URL` = `postgresql://UTENTE:PASSWORD@localhost:5432/NOME_DATABASE`
- `SESSION_SECRET` = `la_tua_chiave_segreta`
- `ADMIN_EMAIL` = `tuaemail@esempio.com`
- `ADMIN_PASSWORD` = `la_tua_password_sicura`

### 3. Avvia l'applicazione
Clicca su **Enable Node.js** e poi **Run NPM Install**.
Infine clicca **Restart App**.

---

## Configurazione Reverse Proxy (Alternativa)

Se preferisci usare Apache/Nginx come reverse proxy:

### Apache (in .htaccess o configurazione vhost):
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
ProxyPassReverse / http://localhost:5000/
```

### Nginx:
```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Process Manager (PM2) - Opzionale ma Consigliato

Per mantenere l'app attiva e riavviarla automaticamente:

### 1. Installa PM2 globalmente
```bash
npm install -g pm2
```

### 2. Avvia l'app con PM2
```bash
pm2 start dist/index.js --name "gestione-corsi"
```

### 3. Configura avvio automatico
```bash
pm2 startup
pm2 save
```

### Comandi utili PM2:
- `pm2 status` - Vedi stato app
- `pm2 logs` - Vedi log
- `pm2 restart gestione-corsi` - Riavvia
- `pm2 stop gestione-corsi` - Ferma

---

## Troubleshooting

### L'app non si avvia
1. Controlla i log: `pm2 logs` o nella console Plesk
2. Verifica che le variabili d'ambiente siano corrette
3. Verifica la connessione al database

### Errore di connessione al database
1. Verifica che PostgreSQL sia in esecuzione
2. Controlla che l'utente abbia i permessi corretti
3. Verifica che DATABASE_URL sia corretto

### Porta 5000 occupata
L'app usa la porta 5000 di default. Se occupata, puoi cambiarla impostando la variabile d'ambiente `PORT`.

---

## Aggiornamenti Futuri

Per aggiornare l'applicazione:

1. Scarica la nuova versione da Replit
2. Carica i file aggiornati sul server
3. Via SSH, esegui:
   ```bash
   npm install
   npm run build
   npm run db:push
   pm2 restart gestione-corsi
   ```
