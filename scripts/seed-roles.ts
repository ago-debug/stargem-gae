import "dotenv/config";
import { db } from "../server/db";
import { userRoles } from "@shared/schema";
import { eq } from "drizzle-orm";

const ALL_PATHS = [
  "/dashboard", "/maschera-input", "/anagrafica-generale", "/tessere-certificati", "/generazione-tessere", "/accessi",
  "/pagamenti", "/scheda-contabile", "/report",
  "/attivita", "/iscritti_per_attivita", "/calendario-attivita", "/planning", "/programmazione-date", "/studios", "/affitto-studio",
  "/staff", "/inserisci-nota", "/commenti", "/todo-list", "/knowledge-base",
  "/listini", "/promo-sconti",
  "/admin", "/elenchi", "/importa", "/utenti-permessi", "/audit-logs", "/reset-stagione"
];

function buildPerms(allowed: string[], allReadOnly: boolean = false) {
  const p: any = {};
  allowed.forEach(path => {
    p[path] = allReadOnly ? "read" : "write";
  });
  return p;
}

const rolesToSeed = [
  {
    name: "Super Admin",
    description: "Amministratore Totale. 100% dei poteri.",
    permissions: { "*": "write" } // Il backend legge "*" come superuser
  },
  {
    name: "Direttivo",
    description: "Manager e Direzione. Vede amministrazione, planning e staff.",
    permissions: buildPerms([
      "/dashboard", "/maschera-input", "/anagrafica-generale", "/tessere-certificati", "/generazione-tessere", 
      "/pagamenti", "/scheda-contabile", "/report",
      "/attivita", "/iscritti_per_attivita", "/calendario-attivita", "/planning", "/programmazione-date", "/studios", "/affitto-studio",
      "/staff", "/inserisci-nota", "/commenti", "/todo-list", "/knowledge-base",
      "/listini", "/promo-sconti"
      // Esclusi: admin, elenchi, importa, utenti-permessi, audit-logs, reset-stagione, accessi (secondo specifica)
    ])
  },
  {
    name: "Back-Office",
    description: "Segreteria Avanzata e Cassa.",
    permissions: buildPerms([
      "/dashboard", "/maschera-input", "/anagrafica-generale", "/tessere-certificati", "/generazione-tessere", 
      "/pagamenti", // Lista Pagamenti
      "/attivita", "/iscritti_per_attivita", "/calendario-attivita", "/planning", "/programmazione-date", "/studios", "/affitto-studio",
      "/inserisci-nota", "/commenti", "/todo-list", "/knowledge-base"
      // Esclusi: Scheda Contabile, Report, Listini, Promo-Sconti, Risorse Umane globali, Configurazione globale
    ])
  },
  {
    name: "Front-Desk",
    description: "Reception Base e Controllo Accessi.",
    permissions: buildPerms([
      "/accessi", "/maschera-input", "/calendario-attivita", "/inserisci-nota", "/todo-list", "/knowledge-base"
    ]) // Hanno permesso per maschera-input per operare sui singoli passaggi
  },
  {
    name: "Staff / Insegnante",
    description: "Ruolo consultivo limitato per docenti.",
    permissions: buildPerms([
      "/calendario-attivita", "/iscritti_per_attivita", "/inserisci-nota", "/knowledge-base"
      // Nascosti pagamenti, anagrafiche generali, ecc.
    ])
  }
];

async function seed() {
  console.log("Inizio propagazione dei 5 Ruoli Ufficiali (Security Matrix)...");
  for (const roleDef of rolesToSeed) {
    const existing = await db.select().from(userRoles).where(eq(userRoles.name, roleDef.name)).limit(1);
    
    if (existing.length > 0) {
      console.log(`Aggiornamento poteri per ruolo esistente: ${roleDef.name}`);
      await db.update(userRoles)
        .set({
          description: roleDef.description,
          permissions: roleDef.permissions
        })
        .where(eq(userRoles.id, existing[0].id));
    } else {
      console.log(`Creazione nuovo ruolo: ${roleDef.name}`);
      await db.insert(userRoles).values({
        name: roleDef.name,
        description: roleDef.description,
        permissions: roleDef.permissions
      });
    }
  }
  
  console.log("Propagazione Ruoli Completata e Allineata ai 30 compartimenti della UI.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Errore durante il seeding dei ruoli:", err);
  process.exit(1);
});
