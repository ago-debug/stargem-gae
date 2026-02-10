import ActivityManagementPage from "@/components/activity-management-page";

export default function VacationStudies() {
  return (
    <ActivityManagementPage
      title="Vacanze Studio"
      subtitle="Gestisci vacanze studio e viaggi formativi"
      apiEndpoint="/api/vacation-studies"
      categoryApiEndpoint="/api/vacation-categories"
      itemLabel="vacanza studio"
      itemLabelPlural="vacanze studio"
      testIdPrefix="vacation-study"
    />
  );
}
