# 🚀 Setup PlanetScale - Guida Completa

## ✅ Cosa Stai Facendo

Stai configurando un database MySQL gratuito su PlanetScale per la tua applicazione CourseManager.

---

## 📋 Passi da Seguire

### 1️⃣ Crea Account PlanetScale (1 minuto)

1. Vai su: **https://planetscale.com**
2. Clicca **"Get started"** (in alto a destra)
3. Registrati con:
   - **GitHub** (consigliato - più veloce)
   - Google
   - Email

### 2️⃣ Crea il Database (1 minuto)

1. Una volta loggato, clicca **"Create a database"** o **"New database"**
2. Compila:
   - **Name**: `gestione-corsi` (o `coursemanager`)
   - **Region**: Scegli la più vicina (es. `AWS eu-west-1` per Europa)
   - **Plan**: Lascia **"Hobby"** ✅ GRATIS
3. Clicca **"Create database"**

### 3️⃣ Ottieni Connection String (30 secondi)

1. Nel database appena creato, vai su **"Connect"**
2. Clicca **"Create password"** o **"New password"**
3. Nome password: `local-dev` (o come preferisci)
4. In **"Connect with"** seleziona **"Prisma"** o **"Node.js"**
5. **COPIA** la connection string che appare

Esempio di connection string:
```
mysql://abc123xyz:pscale_pw_abc123xyz@aws.connect.psdb.cloud/gestione-corsi?sslaccept=strict
```

### 4️⃣ Configura il Progetto Locale (30 secondi)

1. **Apri il file `.env`** nel progetto:
   ```bash
   nano .env
   ```

2. **Sostituisci** la riga `DATABASE_URL` con la connection string di PlanetScale:
   ```env
   DATABASE_URL=mysql://TUA_CONNECTION_STRING_QUI
   ```

3. **Salva** il file (Ctrl+O, Invio, Ctrl+X se usi nano)

### 5️⃣ Testa la Connessione (10 secondi)

```bash
npm run db:test
```

Dovresti vedere:
```
✅ Successfully connected to MySQL!
MySQL version: 8.0.x
Current database: gestione-corsi
```

### 6️⃣ Applica le Migrazioni (30 secondi)

```bash
npm run db:push
```

Questo creerà tutte le tabelle nel database PlanetScale.

### 7️⃣ Verifica le Tabelle (opzionale)

```bash
npm run db:studio
```

Questo aprirà Drizzle Studio nel browser dove puoi vedere tutte le tabelle create.

### 8️⃣ Avvia l'Applicazione

```bash
npm run dev
```

---

## 🎯 Checklist Veloce

- [ ] Account PlanetScale creato
- [ ] Database "gestione-corsi" creato
- [ ] Password/connection string ottenuta
- [ ] File `.env` aggiornato con la connection string
- [ ] Test connessione: `npm run db:test` ✅
- [ ] Migrazioni applicate: `npm run db:push` ✅
- [ ] App avviata: `npm run dev` ✅

---

## 💡 Note Importanti

### Connection String

La connection string di PlanetScale ha questo formato:
```
mysql://USERNAME:PASSWORD@HOST/DATABASE?sslaccept=strict
```

**Non condividere mai** la tua connection string! Contiene le credenziali di accesso.

### SSL/TLS

PlanetScale richiede connessioni SSL. La connection string include già `?sslaccept=strict` che abilita SSL automaticamente.

### Limiti Piano Gratuito

Il piano Hobby (gratuito) include:
- ✅ 5 GB di storage
- ✅ 1 miliardo di letture al mese
- ✅ 10 milioni di scritture al mese
- ✅ Backup automatici
- ✅ Branching del database

Più che sufficiente per sviluppo e piccole applicazioni!

---

## 🔧 Troubleshooting

### Errore: "SSL connection error"

Se vedi errori SSL, assicurati che la connection string includa `?sslaccept=strict` alla fine.

### Errore: "Access denied"

Verifica di aver copiato correttamente la connection string, inclusi username e password.

### Database vuoto dopo db:push

Normale! Le tabelle vengono create ma sono vuote. Puoi:
- Usare l'app per inserire dati
- Importare dati da CSV
- Usare gli script di seed

---

## 📊 Dashboard PlanetScale

Nella dashboard PlanetScale puoi:
- 📈 Vedere statistiche di utilizzo
- 🔍 Eseguire query SQL direttamente
- 📸 Creare backup
- 🌿 Creare branch del database (come Git!)
- 👥 Gestire utenti e permessi

---

## 🚀 Prossimi Passi

Una volta che tutto funziona:

1. **Testa l'applicazione** completamente
2. **Importa i dati** se necessario
3. **Configura backup** (automatici su PlanetScale)
4. **Deploy in produzione** quando pronto

---

## 📞 Supporto

- **Documentazione PlanetScale**: https://planetscale.com/docs
- **Community Discord**: https://discord.gg/planetscale
- **Status Page**: https://status.planetscale.com

---

**Tutto pronto! Segui i passi sopra e in 5 minuti hai il database funzionante! 🎉**
