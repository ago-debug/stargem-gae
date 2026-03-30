# Configurazione e Avvio Tunnel DB Locale

Per sviluppare dal tuo Mac con i dati in tempo reale dal VPS **IONOS (stargem_v2)** aggirando il firewall sulla porta 3306, è necessario aprire un ponte crittografato *SSH* locale sulla porta *3307*.

## Istruzioni (Da fare prima di ogni sessione di sviluppo)

- **Terminale 1 (Il Ponte):**
  Lancia lo script che trovi in questa cartella:
  ```bash
  bash scripts/tunnel-db.sh
  ```
  *(Se ti chiede la password di IONOS, digitala). Il terminale entrerà in ascolto e sembrerà bloccato senza prompt. **Lascialo andare per tutta la giornata lavorativa e ridimensionalo/riducilo a icona**.*

- **Terminale 2 (Lo Sviluppo Vite/Node):**
  Apri un secondo terminale all'interno del progetto Coursemanager e lancia normalmente:
  ```bash
  npm run dev
  ```

Se la connessione al database cade o Drizzle lancia un errore `ECONNREFUSED 127.0.0.1:3307`, significa che hai chiuso per sbaglio il Terminale 1 e il tunnel è caduto. Riavvia semplicemente lo script!
