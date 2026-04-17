const fs = require('fs');
const path = require('path');

const gaeDir = '/Users/gaetano1/SVILUPPO/StarGem_manager/_GAE_SVILUPPO';

// 1. UPDATE 00A_GAE_ULTIMI_AGGIORNAMENTI.md
let file00A = path.join(gaeDir, '00A_GAE_ULTIMI_AGGIORNAMENTI.md');
let txt00A = fs.readFileSync(file00A, 'utf8');
const entry00A = `
### 16-17 Aprile 2026 (Completamento Modulo GemTeam & Dashboard Staff)
* **[F1-023] Importazione Massiva Turni & Presenze:** Elaborato e schierato lo script nativo \`import_turni.ts\` per l'assorbimento retroattivo da Excel master dei log operativi Staff (\`team_TURNI.xlsx\` e \`team_20252026_PRESENZE_TEAM.xlsx\`). Processate e sanificate su database le ore giacenti e gli orari di ingresso/uscita pregressi, mappando le anagrafiche sul layer relazionale unificato MySQL.
* **[F1-024] Estensione Enum Postazioni:** Modificato in emergenza lo strato database \`stargem_v2\` integrando dinamicamente nuovi enum (ad esempio \`C. CHIAMATE\`) sfuggiti al mock originario, bypassando le restrizioni di MariaDB per garantire la coerenza 1:1 dello shift-board con la struttura gestionale.
* **[F2-015 / F2-016] Architettura Core GemTeam Shift & Dashboard:** Trasformata la sezione Staff/Team (\`/gemteam\`).
  * **Shift Dashboard:** Implementata KPI Bar con metriche live (In Sede, Online, Usciti, Non Pervenuti). Costruite le routines asincrone di polling ed i totalizzatori nativi che distinguono i login cloud.
  * **Self-Service Check-In:** Iniettato nello Sheet Personale il modulo action-based per la timbratura d'ingresso e uscita (\`Entra in Sede\` / \`Esci Sede\`), connesso dinamicamente alla route unificata \`POST /api/gemteam/checkin\`.
  * **Full-Width Shift Grid (V2):** Disaccoppiato strategicamente il contenitore del calendario settimanale dei turni dal Root Layout Max-Width (\`max-w-7xl\`). Configurato lo sprawl al 100% dell'asse orizzontale (\`w-full\`) consentendo alle matrici orarie di riempire i monitor giganti senza compressione o padding.
  * **Sistema Esclusione Silente (Dummy Accounts):** Costruita pipeline di filtering su rendering per decurtare in vivo gli account di root-bot (Admin \`15\`, AI \`16\`) rimuovendone le spine di calcolo dalle totalizzazioni "Attesi".

`;
if (!txt00A.includes('16-17 Aprile 2026')) {
    txt00A = txt00A.replace('### 15 Aprile 2026', entry00A + '### 15 Aprile 2026');
    fs.writeFileSync(file00A, txt00A);
    console.log('Updated 00A');
}

// 2. UPDATE 00B_GAE_Checklist_Operativa.md
let file00B = path.join(gaeDir, '00B_GAE_Checklist_Operativa.md');
let txt00B = fs.readFileSync(file00B, 'utf8');
const entry00B = `[16-17/04 · GemTeam UI/UX] F1-023→024 + F2-015→016
  [x] DB: Modificata tabella staff_presenze (ore in formato h:m) tramite script.
  [x] DB: Alter Table column su Enum \`postazione\`.
  [x] Import: Mappatura Turni Settimanale tramite Drizzle ORM.
  [x] Dashboard: 5 KPI (Presenti, Usciti, Assenti, etc) e badge Online operativi.
  [x] Check-In: Flow ingressi dipendenti da interfaccia /gemteam.
  [x] Grid View: Vista Collettiva Full-Width (Tutto lo schermo) per visualizzazione panoramica 4k.
  [x] Edge Cases: Nascosti botAI e super-admin dalla turnazione.

`;
if (!txt00B.includes('[16-17/04 · GemTeam UI/UX]')) {
    txt00B = txt00B.replace('[15/04 · Chat_10_Utenti-GemPortal]', entry00B + '[15/04 · Chat_10_Utenti-GemPortal]');
    fs.writeFileSync(file00B, txt00B);
    console.log('Updated 00B');
}

// 3. UPDATE attuale/01_Architettura_Core_Server.md
let file01 = path.join(gaeDir, 'attuale', '01_Architettura_Core_Server.md');
let txt01 = fs.readFileSync(file01, 'utf8');
if (!txt01.includes('KPI Presenze') && txt01.includes('GemTeam')) {
    txt01 = txt01.replace('✅ In Attivazione', '✅ Operativo (Completo di import turni e KPI Presenze)');
    fs.writeFileSync(file01, txt01);
    console.log('Updated 01_Arch');
}

// 4. UPDATE attuale/02_Frontend_Moduli.md
let file02 = path.join(gaeDir, 'attuale', '02_Frontend_Moduli.md');
if (fs.existsSync(file02)) {
    let txt02 = fs.readFileSync(file02, 'utf8');
    if (!txt02.includes('Full-Width Toggle')) {
        let searchFor = 'I moduli frontend principali son';
        if (txt02.includes(searchFor)) {
            // Find a good place to insert logic about GemTeam 
            txt02 += `\n### Aggiornamento UI 16-17 Aprile: GemTeam Modulo\n* Il pannello GemTeam (\`/gemteam\`) sfrutta layout responsivi adattivi. La \`Tab Turni\` forza il rendering a schermo intero scavalcando il container \`max-w-7xl\` per estendere il calendario settimanale da bordo a bordo.\n* Implementati calcoli matematici on-the-fly (`fmtMin`, \`fmtOre\`) per la visualizzazione decimale delle ore lavorate.\n`;
            fs.writeFileSync(file02, txt02);
            console.log('Updated 02_Front');
        } else {
            console.log('Could not find generic text in 02_Front, appending to end.');
            txt02 += `\n### Aggiornamento UI 16-17 Aprile: GemTeam Modulo\n* Il pannello GemTeam (\`/gemteam\`) sfrutta layout responsivi adattivi. La \`Tab Turni\` forza il rendering a schermo intero scavalcando il container \`max-w-7xl\` per estendere il calendario settimanale da bordo a bordo.\n* Implementati calcoli logici on-the-fly (bottoni Entra/Esci, `fmtMin`, \`fmtOre\`) per la conversione presenze e totalizzatori.\n`;
            fs.writeFileSync(file02, txt02);
            console.log('Updated 02_Front as append');
        }
    }
}

// 5. UPDATE attuale/03_Stato_Lavori_e_Briefing.md
let file03 = path.join(gaeDir, 'attuale', '03_Stato_Lavori_e_Briefing.md');
if (fs.existsSync(file03)) {
    let txt03 = fs.readFileSync(file03, 'utf8');
    if (!txt03.includes('Importazione Massiva Turni (17 Aprile)')) {
        txt03 += `\n### Stato Attuale (Aggiornamento 17 Aprile 2026)\n* **Moduli HR (GemTeam & GemStaff):** L'intero hub per il dipendente è stato validato con l'importazione massiva di storico log presenze. L'adozione del sistema di controllo orario 100% nativo (zero dipendenze esterne tipo Athena) è ratificata visivamente dal full-width calendar dei turni.\n`;
        fs.writeFileSync(file03, txt03);
        console.log('Updated 03_Stato');
    }
}

// 6. UPDATE futuro/01_Espansione_CRM.md
let fileFuturo = path.join(gaeDir, 'futuro', '01_Espansione_CRM.md');
if (fs.existsSync(fileFuturo)) {
    let txtFuturo = fs.readFileSync(fileFuturo, 'utf8');
    if (!txtFuturo.includes('Le infrastrutture gemelle di HR e Member-Dashboard')) {
        txtFuturo += `\n\n> *Nota di Servizio (17 Aprile 2026):* Le infrastrutture gemelle di HR (GemTeam) e Member-Dashboard (GemPass) sono state portate a uno stato Operativo Avanzato. Questo sblocca definitivamente le risorse di engineering frontend per potersi dedicare interamente alla progettazione concettuale ed empirica delle automazioni Clarissa CRM.\n`;
        fs.writeFileSync(fileFuturo, txtFuturo);
        console.log('Updated Futuro 01');
    }
}

console.log('All updates complete.');
