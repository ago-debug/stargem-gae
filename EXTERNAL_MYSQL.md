# Configurazione MySQL Server Esterno

## 🌐 Opzioni Disponibili

### 1. PlanetScale (⭐ CONSIGLIATO - GRATIS)

**Vantaggi:**
- ✅ Piano gratuito generoso (5GB storage, 1 miliardo di letture/mese)
- ✅ Serverless, scalabile automaticamente
- ✅ Branching del database (come Git!)
- ✅ Dashboard web intuitiva
- ✅ SSL/TLS automatico
- ✅ Backup automatici

**Setup:**
1. Vai su https://planetscale.com
2. Crea un account (gratis)
3. Crea un nuovo database chiamato `gestione-corsi`
4. Vai su "Connect" → "Create password"
5. Seleziona "Node.js" come framework
6. Copia la connection string

**Connection String:**
```env
DATABASE_URL=mysql://xxxxxxxxx:pscale_pw_xxxxxxxxx@aws.connect.psdb.cloud/gestione-corsi?ssl={"rejectUnauthorized":true}
```

---

### 2. Railway.app (GRATIS con limiti)

**Vantaggi:**
- ✅ $5 di credito gratuito al mese
- ✅ Deploy automatico da GitHub
- ✅ Setup velocissimo
- ✅ Dashboard moderna

**Setup:**
1. Vai su https://railway.app
2. Login con GitHub
3. New Project → Deploy MySQL
4. Vai su "Connect" → copia la connection string

**Connection String:**
```env
DATABASE_URL=mysql://root:password@containers-us-west-xxx.railway.app:6543/railway
```

---

### 3. Aiven (GRATIS 30 giorni)

**Vantaggi:**
- ✅ Trial gratuito 30 giorni
- ✅ Multi-cloud (AWS, GCP, Azure)
- ✅ Backup automatici
- ✅ Monitoraggio incluso

**Setup:**
1. Vai su https://aiven.io
2. Crea account
3. Create Service → MySQL
4. Seleziona cloud provider e regione
5. Copia la connection string

---

### 4. Server Plesk Esistente

Se hai già un server con Plesk:

**Setup via Plesk Panel:**
1. Login a Plesk
2. Databases → Add Database
3. Nome: `gestione_corsi`
4. Crea utente: `app_user`
5. Password: genera una password sicura
6. Permessi: tutti i permessi sul database

**Setup via SSH:**
```bash
ssh user@tuo-server.com
mysql -u root -p

CREATE DATABASE gestione_corsi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'%' IDENTIFIED BY 'password_sicura_complessa';
GRANT ALL PRIVILEGES ON gestione_corsi.* TO 'app_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

**Connection String:**
```env
DATABASE_URL=mysql://app_user:password_sicura_complessa@tuo-server.com:3306/gestione_corsi
```

**⚠️ Importante per Plesk:**
- Assicurati che MySQL accetti connessioni remote (porta 3306 aperta)
- Configura il firewall per permettere connessioni dalla tua IP
- Usa SSL se possibile

---

### 5. DigitalOcean Managed Database

**Vantaggi:**
- ✅ Gestito completamente
- ✅ Backup automatici
- ✅ Alta disponibilità
- ✅ $200 credito per nuovi account (60 giorni)

**Costi:**
- Da $15/mese per il piano base

**Setup:**
1. Vai su https://www.digitalocean.com
2. Create → Databases → MySQL
3. Seleziona regione e piano
4. Copia la connection string

---

## 🚀 Configurazione Locale

Dopo aver ottenuto la connection string da uno dei servizi sopra:

### 1. Aggiorna `.env`

```bash
# Apri il file .env
nano .env

# Aggiorna la riga DATABASE_URL con la tua connection string
DATABASE_URL=mysql://username:password@host:port/database
```

### 2. Testa la Connessione

```bash
npm run db:test
```

Dovresti vedere:
```
✅ Successfully connected to MySQL!
MySQL version: 8.0.x
Current database: gestione_corsi
```

### 3. Applica le Migrazioni

```bash
npm run db:push
```

### 4. Verifica le Tabelle

```bash
npm run db:studio
```

Questo aprirà Drizzle Studio nel browser dove puoi vedere tutte le tabelle create.

### 5. Avvia l'Applicazione

```bash
npm run dev
```

---

## 🔒 Sicurezza

### Connection String con SSL

Per connessioni sicure, usa questo formato:

```env
# Con SSL (consigliato per produzione)
DATABASE_URL=mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}

# Con certificato custom
DATABASE_URL=mysql://user:pass@host:port/db?ssl={"ca":"/path/to/ca.pem"}
```

### Variabili Separate (alternativa)

Invece di una singola connection string, puoi usare variabili separate:

```env
MYSQL_HOST=aws.connect.psdb.cloud
MYSQL_PORT=3306
MYSQL_USER=username
MYSQL_PASSWORD=password
MYSQL_DATABASE=gestione_corsi
MYSQL_SSL=true

# Poi costruisci la URL nel codice
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}
```

---

## 🎯 Raccomandazione

**Per sviluppo locale:** PlanetScale (gratis, facile, veloce)

**Per produzione:** 
- Se hai già Plesk → usa il database Plesk
- Altrimenti → PlanetScale o DigitalOcean Managed Database

---

## 📝 Checklist

- [ ] Scegli un provider
- [ ] Crea il database
- [ ] Ottieni la connection string
- [ ] Aggiorna `.env` con DATABASE_URL
- [ ] Testa connessione: `npm run db:test`
- [ ] Applica migrazioni: `npm run db:push`
- [ ] Verifica tabelle: `npm run db:studio`
- [ ] Avvia app: `npm run dev`

---

**Tutto pronto! Il codice è già configurato per MySQL. Basta solo la connection string! 🚀**
