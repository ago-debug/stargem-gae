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

const keyMapping: Record<string, string> = {
  "firstName": "Nome",
  "lastName": "Cognome",
  "amount": "Importo (€)",
  "price": "Prezzo (€)",
  "notes": "Note",
  "status": "Stato",
  "role": "Ruolo",
  "email": "Email",
  "phone": "Telefono",
  "title": "Titolo",
  "description": "Descrizione",
};

export function translateEntity(entityType: string): string {
  if (!entityType) return "-";
  return entityMap[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase();
}

export function translateActivity(action: string, entityType: string, details: any): string {
  const entityName = translateEntity(entityType);

  if (action === "LOGIN") return "Login (Accesso al sistema)";
  if (action === "LOGOUT") {
    if (details?.durationMins !== undefined) {
      const ore = Math.floor(details.durationMins / 60);
      const min = details.durationMins % 60;
      return `Logout (Sessione durata: ${ore > 0 ? `${ore}h ` : ""}${min}m)`;
    }
    return "Logout dal sistema";
  }

  if (action === "DELETE") return `🗑️ Eliminato elemento: ${entityName}`;

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
      return `✏️ Aggiornato ${entityName}`;
    }
    
    const updatedKeys = Object.keys(details)
      .filter(k => k !== "id" && k !== "createdAt" && k !== "updatedAt" && k !== "password")
      .map(k => {
        const val = details[k];
        const valStr = typeof val === 'object' ? '[Dettagli Tecnici]' : String(val);
        const humanKey = keyMapping[k] || k.charAt(0).toUpperCase() + k.slice(1);
        return `${humanKey} (${valStr})`;
      });

    return `✏️ Aggiornato ${entityName}. Valori inseriti: ${updatedKeys.length > 0 ? updatedKeys.join(", ") : "dati vari"}`;
  }

  return `${action} su ${entityName}`;
}
