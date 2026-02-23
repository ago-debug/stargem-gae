# Deploy Continuo su Plesk tramite Git

Questa guida ti permetterà di collegare il nostro codice in locale direttamente al server VPS. Ogni volta che faremo una modifica, un semplice comando "push" aggiornerà l'applicazione e la riavvierà in automatico, senza più bisogno di creare file ZIP!

## Fase 1: Configurazione su Plesk (sul tuo Server)

1. Vai sul tuo pannello Plesk.
2. Clicca su **Domini** e seleziona `stargem.studio-gem.it`.
3. Sulla destra o tra i vari strumenti, cerca l'icona **Git** e cliccaci sopra.
4. Clicca su **Aggiungi Repository** (o _Add Repository_).
5. Seleziona l'opzione **"Repository locale sul server"** (Repository locale).
6. Come directory di distribuzione (Deployment directory), seleziona la tua cartella `httpdocs` (o quella in cui si trova l'app Node).
7. Clicca su **Applica** / **OK**.
8. Ora ti apparirà una schermata che mostra l'**URL del repository Git** remoto di Plesk (simile a `test@alessandromagno.abreve.it:~/stargem.git` o `https://...`).
   ➡ **Copia questo URL**, ci servirà tra un attimo.

---

## Fase 2: Configurare le Azioni Automatiche su Plesk

Sempre nella schermata di Git in Plesk, vai in **Impostazioni Repository (Repository Settings)**.
Attiva le **Azioni da Eseguire dopo il Pull (Enable additional deploy actions)**. Inserisci questi due semplici comandi, che verranno eseguiti in automatico dal server ogni volta che inviamo nuovo codice:

```bash
npm install
npm run build
touch tmp/restart.txt
```
*(Il comando `touch tmp/restart.txt` serve a comunicare a Phusion Passenger/Node.js di riavviarsi e caricare le modifiche senza che tu debba cliccare nulla nel pannello)*.

Clicca su **Applica** / **Salva**.

---

## Fase 3: Collegare il Mac a Plesk

Ora torniamo qui, sul tuo Mac, al terminale di CourseManager.
*(Posso eseguire io questi comandi per te non appena mi darai l'URL copiato!)*

Devi solo passarmi l'URL del repository Git che ti ha generato Plesk al punto 8. In un attimo lancerò i comandi per:
1. Rendere questa cartella un progetto Git ufficiale locale.
2. Aggiungere Plesk come "telecomando" (remote) `git remote add plesk [TUO_URL_PLESK]`.
3. Inviare tutto il codice su Plesk con un solo clic!

**Scrivimi qui l'URL di Git che Plesk ti ha mostrato. (Se è un link SSH, assicurati che la password o la chiave SSH del server sia già configurata sul Mac, altrimenti ti chiederà la password root del server quando provi a fare push).**
