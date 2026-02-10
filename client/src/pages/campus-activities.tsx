import ActivityManagementPage from "@/components/activity-management-page";

export default function CampusActivities() {
  return (
    <ActivityManagementPage
      title="Campus"
      subtitle="Gestisci campus e programmi intensivi"
      apiEndpoint="/api/campus-activities"
      categoryApiEndpoint="/api/campus-categories"
      itemLabel="campus"
      itemLabelPlural="campus"
      testIdPrefix="campus-activity"
    />
  );
}
