import ActivityManagementPage from "@/components/activity-management-page";

export default function SundayActivities() {
  return (
    <ActivityManagementPage
      title="Riepilogo Domeniche in Movimento"
      subtitle="Gestisci le attività domenicali speciali"
      apiEndpoint="/api/sunday-activities"
      categoryApiEndpoint="/api/sunday-categories"
      itemLabel="attività domenicale"
      itemLabelPlural="attività domenicali"
      baseRoute="/scheda-domenica"
      testIdPrefix="sunday-activity"
    />
  );
}
