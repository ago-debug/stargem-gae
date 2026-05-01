import { openai } from '@ai-sdk/openai';
import { generateText, streamText, tool } from 'ai';
import { z } from 'zod';
import { db } from './db';
import { members, courses } from '../shared/schema';
import { eq, like, or } from 'drizzle-orm';

// Contesto di sistema per l'Agente Teo dinamico in base al ruolo utente
export const getTeoSystemPrompt = (userRole: string, userName: string) => `Sei Teo, l'assistente virtuale e intelligenza operativa di StarGem Manager (un gestionale per scuole di danza e palestre).
Stai parlando con l'utente ${userName}, il cui ruolo nel sistema è: ${userRole.toUpperCase()}.

REGOLE DI COMPORTAMENTO:
1. Sii estremamente professionale, rapido e conciso. Non usare preamboli inutili.
2. Rispondi in italiano.
3. Se l'utente ti chiede informazioni sugli iscritti o sui corsi, usa gli strumenti (tools) a tua disposizione per cercare nel database.
4. Se non trovi un dato tramite i tools, ammetti di non averlo trovato. Non inventare dati (no allucinazioni).
5. LIMITI DI SICUREZZA (RBAC): Rispetta in modo assoluto il ruolo dell'utente. Se il ruolo è "SEGRETERIA" o "CLIENT", non fornire MAI dati su incassi, stipendi, profitti totali aziendali, o metriche amministrative sensibili, e avvisa l'utente che non ha i permessi per questi dati. Se il ruolo è "ADMIN", "AMMINISTRATORE" o "MASTER", hai accesso completo.
6. Il tuo tono è da "concierge d'hotel 5 stelle": efficiente, cortese, rassicurante.`;

/**
 * Fabbrica dei Tools (Hard RBAC)
 * I tools vengono rigenerati ad ogni richiesta passando il ruolo dell'utente
 * per garantire che le query non partano mai se non c'è il permesso.
 */
export const getAiTools = (userRole: string) => ({
  searchMembers: tool({
  description: 'Cerca un iscritto per nome, cognome o email nel database del gestionale.',
  parameters: z.object({
    query: z.string().describe("Il nome, cognome o parte dell'email da cercare"),
  }),
  execute: async ({ query }: { query: string }) => {
    // Controllo RBAC Fisico
    const role = userRole.toLowerCase();
    if (role === 'client' || role === 'external') {
      return "Accesso Negato: Il tuo ruolo non ti permette di cercare nell'anagrafica.";
    }

    console.log(`[AI Tool] Eseguo ricerca membri per: ${query} (Richiesto da Ruolo: ${userRole})`);
    try {
      const results = await db.select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        phone: members.phone
      })
      .from(members)
      .where(
        or(
          like(members.firstName, `%${query}%`),
          like(members.lastName, `%${query}%`),
          like(members.email, `%${query}%`)
        )
      )
      .limit(5);
      
      if (results.length === 0) return "Nessun iscritto trovato.";
      return JSON.stringify(results);
    } catch (e) {
      return "Errore durante la ricerca nel database.";
    }
  }
  }),

  searchCourses: tool({
  description: 'Cerca un corso, evento o attività per nome.',
  parameters: z.object({
    query: z.string().describe("Il nome del corso da cercare"),
  }),
  execute: async ({ query }: { query: string }) => {
    console.log(`[AI Tool] Eseguo ricerca corsi per: ${query} (Richiesto da Ruolo: ${userRole})`);
    try {
      const results = await db.select({
        id: courses.id,
        name: courses.name,
        activityType: courses.activityType
      })
      .from(courses)
      .where(like(courses.name, `%${query}%`))
      .limit(5);
      
      if (results.length === 0) return "Nessun corso trovato.";
      return JSON.stringify(results);
    } catch (e) {
      return "Errore durante la ricerca nel database.";
    }
  }
  })
});

/**
 * Modello predefinito
 */
export const defaultModel = openai('gpt-4o-mini'); // Fast and cost-effective
