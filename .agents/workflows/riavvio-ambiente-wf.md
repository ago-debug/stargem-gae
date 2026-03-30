---
description: Riavvia tunnel SSH (stargem_v2) e Dev Server in terminali persistenti separati.
---

Questo è il workflow automatico di Antigravity per ripristinare il collegamento tra il localhost e il VPS IONOS senza incorrere in crash di timeout (ECONNREFUSED).

Quando l'utente richiede `/riavvio-ambiente-wf` (o lo invochi tu in autonomia per risolvere un DB Error), devi eseguire tassativamente i seguenti passi:

1. Fai pulizia di vecchi terminali e processi morti sul Mac dell'utente:
// turbo
```bash
pkill -f "ssh -N -L" ; pkill -f "npm run dev" ; lsof -ti:5001 | xargs kill -9
```

2. Avvia il tunnel SSH in un TUO nuovo terminale tramite lo strumento `run_command` impostando esplicitamente `"RunPersistent": true`.
```bash
bash scripts/tunnel-db.sh
```

3. MENTRE il Terminale del tunnel rimane aperto e bloccato in esecuzione (foreground), apri parallelamente un ALTRO terminale e lancia il Node server, sempre impostando `"RunPersistent": true` sul tuo strumento:
```bash
sleep 3 && npm run dev
```

4. Esegui un controllo rapido con `curl -I http://localhost:5001` dal tuo tool normale se serve verificare l'avvenuto caricamento delle categorie DB, dopodiché dai luce verde all'utente!
