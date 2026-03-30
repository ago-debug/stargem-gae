# Phase 26: Migrazione Infrastruttura Server VPS IONOS
**Data Operazioni:** 30 Marzo 2026

Questo documento funge da registro storico e Post-Mortem architetturale per documentare il passaggio del progetto `CourseManager` da un dominio/server condiviso Legacy (`185.48.116.156`) al nuovo VPS indipendente IONOS (`82.165.35.145`).

## Il Contesto
Il sistema aveva raggiunto una maturità stabile nella gestione dei Dati (Silos Unificati) ma l'infrastruttura di rete presentava ritardi e limiti, col rischio di precludere lo scale-up verso l'Integrazione Clarissa CRM (Webhooks). 
Si è deciso di migrare tutto il layer di produzione su un server Ubuntu 24.04 dedicato.

## Gli Eventi Cronologici e Soluzioni Adottate

### 1. Duplicazione Database (Da Plesk Legacy a VPS)
* **Criticità Iniziale:** L'utente locale sviluppatore macOS (`Gaetano`) aveva accesso al DB `sg_gae` ma non i privilegi di `root` per crearne cloni sistemistici sul server vecchio mascherato.
* **Azione:** Aggirata la burocrazia Plesk creando in autonomia il DB `stargem_v2` sul nuovo VPS IONOS, ed importandovi 86 tabelle storiche consolidate.

### 2. Sblocco del Local Development (Problema ECONNREFUSED)
Dopo l'allestimento di `stargem_v2` sul nuovo IP, il dev server di Vite/NodeJS locale sul Mac andava in crash tentando di connettersi a `82.165.35.145:3306`.
* **Causa:** Nativi blocchi Firewall in ingresso. Il server MariaDB sul VPS accettava solo connessioni da `localhost`.
* **La Soluzione (Tunnel SSH):** 
Invece di bucare il firewall esponendo il core dei pagamenti a script kid/botnet mondiali, abbiamo implementato un **"Ponte SSH" (Port Forwarding)**.
Tramite lo script creato in `scripts/tunnel-db.sh`:
```bash
ssh -N -L 3307:127.0.0.1:3306 root@82.165.35.145
```
Si è agganciata una pipe silenziosa e sicura tra il Mac ed il VPS. 
Il file `.env` locale è stato riconfigurato su `mysql://gaetano_admin...127.0.0.1:3307/stargem_v2`.

* **Esito:** Connessione trasparente in 5 millisecondi e nessuna istruzione SQL dovuta transitare via internet in chiaro.

### 3. Propagazione DNS In-Flight
Cambiato il "Record A" sul vecchio Plesk per dirottare il traffico pubblico sul dominio `stargem.studio-gem.it` all'IP `82.165.35.145`.
L'audit `nslookup stargem.studio-gem.it 8.8.8.8` ha evidenziato in serata un corposo ritardo di propagazione mondiale (visti i DNS cached TTL fino a 19 ore da provider legacy).
* **Policy decisa:** Trattenuto e procrastinato lo "Step SSL" Let's Encrypt per evitare blocchi AuthZ causa mismatch di risoluzione da parte dell'Authority.

## Schema dell'Ambiente Odierno Definitivo
* **VPS Host:** `82.165.35.145`
* **Node Environment:** 25.8.2 (`pm2` process name: `stargem` in ascolto su porta tcp: `5001`)
* **Reverse Proxy:** Nginx passante le connessioni client root (80/443) verso localhost:5001.
* **Database App:** `stargem_v2` via `gaetano_admin` (MariaDB su porta 3306 chiusa all'esterno).
* **Repository Git:** Tracciato ed in allineamento. `tunnel-db.sh` e `.env` regolarmente protetti in `.gitignore` contro leak accidentali.

## Check futuri da intraprendere
Quando il DNS sarà 100% stabile:
1. Chiudere l'account/database vecchio per prevenire split-brain.
2. Certificare Let's Encrypt al perimetro HTTPS.
3. Testare le performance di read/write simultanee dal dev locale appoggiato in SSH, tenendo conto di eventuali ping spike.
