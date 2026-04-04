export function translateActivity(action: string, entityType: string, details: any): string {
  // Traduzioni entità
  const entityMap: Record<string, string> = {
    "courses": "Corso",
    "users": "Utente",
    "members": "Membro / Anagrafica",
    "enrollments": "Iscrizione",
    "payments": "Pagamento",
    "payments-methods": "Metodo di Pagamento",
    "roles": "Ruolo",
    "studios": "Sala",
    "activities": "Attività / Pacchetto",
    "seasons": "Stagione",
    "system": "Sistema",
    "booking": "Prenotazione"
  };

  const entityName = entityMap[entityType] || entityType;

  // Traduzioni azioni
  if (action === "LOGIN") return "Login (Accesso al sistema)";
  if (action === "LOGOUT") {
    if (details?.durationMins !== undefined) {
      const ore = Math.floor(details.durationMins / 60);
      const min = details.durationMins % 60;
      return `Logout (Sessione durata: ${ore > 0 ? `${ore}h ` : ""}${min}m)`;
    }
    return "Logout dal sistema";
  }

  if (action === "DELETE") return `🗑️ Eliminato: ${entityName}`;

  if (action === "CREATE") {
    let summary = "";
    if (details) {
      if (details.firstName || details.lastName) summary = ` (${details.firstName || ""} ${details.lastName || ""})`.trim();
      else if (details.name) summary = ` ("${details.name}")`;
      else if (details.title) summary = ` ("${details.title}")`;
      else if (details.amount) summary = ` (Valore: €${details.amount})`;
    }
    return `✨ Creato nuovo: ${entityName}${summary}`;
  }

  if (action === "UPDATE") {
    if (!details || Object.keys(details).length === 0) {
      return `✏️ Aggiornato: ${entityName}`;
    }
    
    // Proviamo a estrarre i campi chiave aggiornati
    const updatedKeys = Object.keys(details)
      .filter(k => k !== "id" && k !== "createdAt" && k !== "updatedAt")
      .slice(0, 3) // Massimo 3 campi per non sformattare la UI
      .map(k => {
        const val = details[k];
        const valStr = typeof val === 'object' ? '...' : String(val).substring(0, 15);
        return `${k}=${valStr}`;
      });

    return `✏️ Aggiornato ${entityName}: ${updatedKeys.length > 0 ? updatedKeys.join(", ") : "dati vari"}`;
  }

  return `${action} su ${entityName}`;
}
