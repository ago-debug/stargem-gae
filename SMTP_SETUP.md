# Configurazione SMTP — Studio Gem

## Dove inserire la password
File: `.env` (nella root del progetto)
Riga da modificare:
  SMTP_PASS=inserisci-qui-la-password

## Come trovare la password
1. Accedi al pannello Plesk del server
2. Vai su: Mail → test@studio-gem.it → Modifica
3. Copia la password e incollala nel .env

## Come testare dopo la configurazione
Nel terminale dalla root del progetto:
  npx tsx scripts/test-mailer.ts

## Verifica
Controlla gaechacha@gmail.com —
devono arrivare 3 email di test.
