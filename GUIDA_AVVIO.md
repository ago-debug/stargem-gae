# Guida all'Avvio - CourseManager (Sviluppo Locale)

Questa guida ti aiuterà ad avviare l'applicazione in locale sul tuo Mac.
Poiché l'applicazione richiede un database PostgreSQL per funzionare (gestione utenti, sessioni, dati dei corsi), è necessario installarlo.

## 1. Installazione del Database (Obbligatorio)

L'applicazione non trova PostgreSQL installato sul sistema. Il modo più semplice per risolvere su Mac è usare **Postgres.app**:

1.  Scarica Postgres.app da: **[https://postgresapp.com/downloads.html](https://postgresapp.com/downloads.html)**
2.  Trascina l'icona nella cartella **Applicazioni**.
3.  **Avvia Postgres.app**.
4.  Clicca su "Initialize" se richiesto per creare un nuovo server.
5.  Assicurati che il server sia **Running** (in esecuzione) sulla porta **5432**.

## 2. Configurazione Automatica

Una volta che Postgres.app è in esecuzione:

1.  Apri il terminale nella cartella del progetto:
    ```bash
    cd /Users/augustogenca/Documents/Sviluppo/SG-Gestionale/CourseManager
    ```
2.  Esegui lo script di configurazione database:
    ```bash
    npm run setup
    ```
    *Questo script creerà automaticamente l'utente `app_user` e il database `gestione_corsi`.*

## 3. Avvio dell'Applicazione

Ora puoi avviare l'applicazione:

```bash
npm run dev
```

L'applicazione sarà accessibile all'indirizzo: **http://localhost:5001**

## Note Aggiuntive

*   **Login**: Al primo avvio, verrai reindirizzato alla pagina di login. Puoi usare qualsiasi email/password (es. `admin@local` / `password`) per accedere in modalità sviluppo locale.
*   **Porta**: L'applicazione usa la porta 5001 per evitare conflitti con i servizi di sistema macOS (AirPlay receiver usa la 5000).
