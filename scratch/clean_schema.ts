import { Project } from "ts-morph";

const project = new Project();
project.addSourceFileAtPath("shared/schema.ts");
const sourceFile = project.getSourceFileOrThrow("shared/schema.ts");

const identifiersToRemove = [
  "userActivityLogs", "userActivityLogsRelations", "insertUserActivityLogSchema", "InsertUserActivityLog", "UserActivityLog",
  "tenants", "insertTenantSchema", "InsertTenant", "Tenant",
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
    console.log(`Removed variable: ${name}`);
    removedCount++;
    continue;
  }
  const typeAlias = sourceFile.getTypeAlias(name);
  if (typeAlias) {
    typeAlias.remove();
    console.log(`Removed type alias: ${name}`);
    removedCount++;
    continue;
  }
  console.log(`WARNING: Could not find ${name}`);
}

sourceFile.saveSync();
console.log(`Cleanup complete. Removed ${removedCount} identifiers.`);
