# 🚂 Setup Railway.app - Database MySQL Gratuito

## ✅ Railway.app - VERAMENTE GRATIS

Railway offre **$5 di credito gratuito al mese** che è più che sufficiente per sviluppo e piccole applicazioni.

---

## 📋 Setup Rapido (3 minuti)

### 1️⃣ Crea Account (30 secondi)

1. Vai su: **https://railway.app**
2. Clicca **"Start a New Project"** o **"Login"**
3. Login con **GitHub** (consigliato)

### 2️⃣ Crea Database MySQL (1 minuto)

1. Clicca **"New Project"**
2. Seleziona **"Deploy MySQL"** (o "Provision MySQL")
3. Il database verrà creato automaticamente

### 3️⃣ Ottieni Connection String (30 secondi)

1. Clicca sul database MySQL appena creato
2. Vai su tab **"Connect"** o **"Variables"**
3. Cerca la variabile **`DATABASE_URL`** o **`MYSQL_URL`**
4. **COPIA** il valore

La connection string sarà simile a:
```
mysql://root:password@containers-us-west-xxx.railway.app:6543/railway
```

### 4️⃣ Configura .env (30 secondi)

```bash
# Apri il file .env
nano .env

# Sostituisci DATABASE_URL con quella di Railway
DATABASE_URL=mysql://root:password@containers-us-west-xxx.railway.app:6543/railway

# Salva: Ctrl+O, Invio, Ctrl+X
```

### 5️⃣ Setup Automatico (1 minuto)

```bash
# Esegui lo script automatico
./planetscale-complete.sh
# (funziona anche per Railway, non solo PlanetScale!)
```

### 6️⃣ Avvia App (10 secondi)

```bash
npm run dev
```

---

## 💰 Piano Gratuito Railway

- ✅ **$5 di credito al mese** (gratis)
- ✅ MySQL, PostgreSQL, Redis, MongoDB
- ✅ 500 ore di esecuzione al mese
- ✅ 100 GB di traffico
- ✅ Backup automatici
- ✅ Deploy da GitHub automatico

**Perfetto per sviluppo e piccoli progetti!**

---

## 🔄 Alternative GRATUITE

### 1. **Aiven** (Trial 30 giorni)
- https://aiven.io
- Trial gratuito completo per 30 giorni
- Poi a pagamento

### 2. **FreeSQLDatabase** (Gratis limitato)
- https://www.freesqldatabase.com
- 100% gratis ma con limiti (5MB)
- Solo per test

### 3. **Server Plesk** (se ce l'hai)
- Usa il database sul tuo server esistente
- Esegui: `./setup-plesk-mysql.sh user@server.com`

### 4. **MySQL Locale** (Gratis, locale)
- Installa MySQL sul Mac
- Esegui: `./install-mysql.sh`
- Richiede password amministratore

---

## 🎯 Raccomandazione

**Per sviluppo:** Railway.app ($5/mese gratis)

**Per produzione:** 
- Se hai Plesk → usa quello
- Altrimenti → DigitalOcean Managed Database ($15/mese)

---

## 🚀 Prossimi Passi

1. Vai su https://railway.app
2. Login con GitHub
3. "New Project" → "Deploy MySQL"
4. Copia DATABASE_URL
5. Aggiorna `.env`
6. Esegui `./planetscale-complete.sh`
7. Esegui `npm run dev`

---

**Railway è gratis e pronto in 3 minuti! 🚀**
