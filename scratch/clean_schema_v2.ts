import { Project } from "ts-morph";

const project = new Project();
project.addSourceFileAtPath("shared/schema.ts");
const sourceFile = project.getSourceFileOrThrow("shared/schema.ts");

const identifiersToRemove = [
  "maintenanceTickets", "insertMaintenanceTicketSchema", "InsertMaintenanceTicket", "MaintenanceTicket",
  "crmLeads", "insertCrmLeadSchema", "InsertCrmLead", "CrmLead",
  "crmCampaigns", "insertCrmCampaignSchema", "InsertCrmCampaign", "CrmCampaign",
  "wcProductMapping", "WcProductMapping",
  "teamHandoverNotes", "insertTeamHandoverNoteSchema", "InsertTeamHandoverNote", "TeamHandoverNote",
  "teamMaintenanceTickets", "insertTeamMaintenanceTicketSchema", "InsertTeamMaintenanceTicket", "TeamMaintenanceTicket",
  "teamProfileChangeRequests", "insertTeamProfileChangeRequestSchema", "InsertTeamProfileChangeRequest", "TeamProfileChangeRequest"
];

let removedCount = 0;

for (const name of identifiersToRemove) {
  const variable = sourceFile.getVariableStatement(stmt => stmt.getDeclarations().some(d => d.getName() === name));
  if (variable) {
    variable.remove();
    removedCount++;
    continue;
  }
  const typeAlias = sourceFile.getTypeAlias(name);
  if (typeAlias) {
    typeAlias.remove();
    removedCount++;
    continue;
  }
}

sourceFile.saveSync();
console.log(`Cleanup complete. Removed ${removedCount} identifiers.`);
