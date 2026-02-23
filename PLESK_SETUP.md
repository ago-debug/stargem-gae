# 🖥️ Setup MySQL su Server Plesk - Guida Completa

## ✅ Vantaggi di Usare Plesk

- ✅ Hai già il server
- ✅ Tutto nello stesso posto (app + database)
- ✅ Nessun costo aggiuntivo
- ✅ Controllo completo
- ✅ Backup facili

---

## 📋 Due Metodi Disponibili

### Metodo 1: Pannello Plesk (PIÙ FACILE - 2 minuti)
### Metodo 2: SSH/Script Automatico (PIÙ VELOCE - 1 minuto)

---

## 🖱️ METODO 1: Pannello Plesk (Consigliato)

### Step 1: Accedi a Plesk

1. Apri il tuo pannello Plesk
2. Login con le tue credenziali

### Step 2: Crea il Database

1. Nel menu laterale, vai su **"Databases"** (o "Database")
2. Clicca **"Add Database"** o **"Aggiungi Database"**
3. Compila i campi:
   - **Database name**: `gestione_corsi`
   - **Database server**: Lascia quello di default (MySQL)
4. Clicca **"OK"**

### Step 3: Crea l'Utente Database

1. Nella stessa schermata o cliccando sul database appena creato
2. Vai su **"User Management"** o **"Gestione Utenti"**
3. Clicca **"Add Database User"**
4. Compila:
   - **Username**: `app_user`
   - **Password**: Genera una password sicura (clicca sull'icona genera)
   - **Access hosts**: `%` (per permettere accesso remoto) o `localhost` (solo locale)
5. **COPIA LA PASSWORD** (la userai dopo!)
6. Clicca **"OK"**

### Step 4: Assegna Permessi

1. Torna alla pagina del database
2. Assicurati che l'utente `app_user` abbia **tutti i permessi** sul database `gestione_corsi`
3. Se necessario, seleziona tutti i permessi (SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, etc.)

### Step 5: Ottieni i Dettagli di Connessione

Annota questi dati:
- **Host**: L'indirizzo del tuo server (es. `mioserver.com` o IP `123.45.67.89`)
- **Port**: `3306` (porta MySQL di default)
- **Database**: `gestione_corsi`
- **Username**: `app_user`
- **Password**: La password che hai generato

### Step 6: Costruisci la Connection String

```env
DATABASE_URL=mysql://app_user:TUA_PASSWORD@mioserver.com:3306/gestione_corsi
```

Sostituisci:
- `TUA_PASSWORD` con la password generata
- `mioserver.com` con l'indirizzo del tuo server

---

## 💻 METODO 2: Script Automatico via SSH (Più Veloce)

### Prerequisiti
- Accesso SSH al server
- Permessi root o sudo

### Step 1: Esegui lo Script

```bash
# Dal tuo Mac, esegui:
./setup-plesk-mysql.sh root@mioserver.com
```

Sostituisci `mioserver.com` con l'indirizzo del tuo server.

### Step 2: Lo Script Farà Automaticamente

- ✅ Crea il database `gestione_corsi`
- ✅ Crea l'utente `app_user`
- ✅ Genera una password sicura
- ✅ Assegna tutti i permessi
- ✅ Ti fornisce la connection string pronta

### Step 3: Copia la Connection String

Lo script ti mostrerà qualcosa come:
```
Connection String per .env:
DATABASE_URL=mysql://app_user:xyz123abc@mioserver.com:3306/gestione_corsi
```

---

## 🔧 Configurazione Locale

### Step 1: Aggiorna .env

```bash
# Apri il file .env
nano .env

# Sostituisci DATABASE_URL con quella del tuo server Plesk
DATABASE_URL=mysql://app_user:password@mioserver.com:3306/gestione_corsi

# Salva: Ctrl+O, Invio, Ctrl+X
```

### Step 2: Test Connessione

```bash
npm run db:test
```

Dovresti vedere:
```
✅ Successfully connected to MySQL!
MySQL version: 8.0.x
Current database: gestione_corsi
```

### Step 3: Applica Migrazioni

```bash
npm run db:push
```

Questo creerà tutte le tabelle nel database.

### Step 4: Avvia App

```bash
npm run dev
```

---

## 🔒 Configurazione Firewall (Importante!)

Se non riesci a connetterti, potrebbe essere il firewall:

### Opzione A: Permetti la Tua IP

1. In Plesk, vai su **"Tools & Settings"** → **"Firewall"**
2. Aggiungi una regola per permettere connessioni MySQL (porta 3306) dalla tua IP
3. Oppure permetti tutte le connessioni MySQL (meno sicuro)

### Opzione B: Via SSH

```bash
# Accedi al server
ssh root@mioserver.com

# Permetti connessioni MySQL
ufw allow 3306/tcp

# O permetti solo dalla tua IP
ufw allow from TUA_IP to any port 3306
```

### Opzione C: Solo Connessioni Locali (Più Sicuro)

Se vuoi usare il database solo quando l'app è deployata sullo stesso server:

```env
# Usa localhost invece dell'IP pubblico
DATABASE_URL=mysql://app_user:password@localhost:3306/gestione_corsi
```

Questo funziona solo se l'app gira sullo stesso server del database.

---

## 🔐 Configurazione MySQL Remoto (Opzionale)

Se MySQL non accetta connessioni remote:

```bash
# Accedi al server
ssh root@mioserver.com

# Modifica la configurazione MySQL
nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Cerca la riga:
bind-address = 127.0.0.1

# Cambiala in:
bind-address = 0.0.0.0

# Salva e riavvia MySQL
systemctl restart mysql
```

---

## 📊 Verifica Configurazione

### Test 1: Connessione da Locale

```bash
npm run db:test
```

### Test 2: Connessione Diretta MySQL

```bash
mysql -h mioserver.com -u app_user -p gestione_corsi
# Inserisci la password quando richiesta
```

Se riesci a connetterti, tutto funziona!

---

## 🎯 Checklist Finale

- [ ] Database `gestione_corsi` creato su Plesk
- [ ] Utente `app_user` creato con password
- [ ] Permessi assegnati all'utente
- [ ] Connection string copiata
- [ ] File `.env` aggiornato
- [ ] Firewall configurato (se necessario)
- [ ] Test connessione: `npm run db:test` ✅
- [ ] Migrazioni applicate: `npm run db:push` ✅
- [ ] App funzionante: `npm run dev` ✅

---

## 💡 Consigli

### Per Sviluppo Locale
- Usa l'IP pubblico del server nella connection string
- Assicurati che il firewall permetta la tua IP

### Per Produzione (App deployata su Plesk)
- Usa `localhost` nella connection string
- Più sicuro e più veloce

---

## ❓ Troubleshooting

### Errore: "Access denied"
- Verifica username e password
- Controlla che l'utente abbia i permessi sul database

### Errore: "Can't connect to MySQL server"
- Verifica che MySQL sia in esecuzione su Plesk
- Controlla il firewall
- Verifica che MySQL accetti connessioni remote

### Errore: "Unknown database"
- Verifica che il database `gestione_corsi` esista
- Controlla il nome del database nella connection string

---

**Pronto! Scegli il metodo che preferisci e in 2 minuti hai il database funzionante! 🚀**
