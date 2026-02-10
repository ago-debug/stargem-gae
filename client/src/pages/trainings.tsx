import ActivityManagementPage from "@/components/activity-management-page";

export default function Trainings() {
  return (
    <ActivityManagementPage
      title="Allenamenti/Affitti"
      subtitle="Gestisci le sessioni di allenamento e affitti"
      apiEndpoint="/api/trainings"
      categoryApiEndpoint="/api/training-categories"
      itemLabel="allenamento"
      itemLabelPlural="allenamenti"
      testIdPrefix="training"
    />
  );
}
