# Deployment su VPS con Plesk (o generico Linux)

Questa guida contiene i comandi pronti all'uso per trasferire, installare e avviare l'applicazione CourseManager sul tuo server VPS.

## 1. Trasferimento file (Dal tuo Mac al Server)

Dal terminale del tuo Mac (dove si trova il file zip appena creato), esegui questo comando per trasferire il file sul server usando SCP (sostituisci `utente` e `indirizzo_ip` con i dati della tua VPS, es: `root@123.45.67.89`):

```bash
scp /Users/augustogenca/Documents/Sviluppo/SG-Gestionale/CourseManager_Export_Latest.zip utente@indirizzo_ip:/percorso/di/destinazione/
```
*(Nota: se usi Plesk, potresti caricare lo zip direttamente dal File Manager del pannello di controllo web)*

---

## 2. Configurazione Server (Da eseguire sul Server VPS)

Accedi al tuo server via SSH:
```bash
ssh utente@indirizzo_ip
```

Spostati nella cartella dove hai caricato lo zip ed estrailo:
```bash
# Vai nella cartella
cd /percorso/di/destinazione/

# Crea una cartella per il progetto
mkdir course-manager
cd course-manager

# Estrai il file zip
unzip ../CourseManager_Export_Latest.zip

# Installa le dipendenze
npm install
```

---

## 3. Configurazione Database e Ambiente

Crea il file `.env` copiandolo dall'esempio o creandolo nuovo:
```bash
# Se hai gia copiato il .env, modificalo, altrimenti:
nano .env
```

Incolla dentro il `.env` le tue vere credenziali:
```env
DATABASE_URL=mysql://studiogemadmin:LATUAPASSWORD@localhost:3306/sg_gae
SESSION_SECRET=una_stringa_molto_lunga_e_casuale_per_sicurezza
NODE_ENV=production
PORT=5001
```
*(Salva premendo `CTRL+X`, poi `Y` e `Invio`)*

Sincronizza il database (questo comando creerà tutte le tabelle su MySQL):
```bash
npm run db:push
```

---

## 4. Compilazione e Avvio con PM2

Compila l'applicazione per la produzione:
```bash
npm run build
```

Installa PM2 globalmente (se non è già installato):
```bash
npm install -g pm2
```

Avvia l'applicazione in background perché rimanga sempre attiva:
```bash
# PM2 rileverà il comando "npm run start" dal package.json e gestirà l'app
pm2 start npm --name "course-manager" -- start

# Salva la configurazione affinché l'app si riavvii automaticamente al riavvio del server
pm2 save
pm2 startup
```

## Opzionale: Configurazione Nginx (Se non usi il proxy di Plesk)
Se vuoi che l'app sia raggiungibile su un dominio senza digitare `:5001`, ecco un esempio di blocco Nginx:
```nginx
server {
    listen 80;
    server_name tuodominio.it;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
