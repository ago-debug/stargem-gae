import ActivityManagementPage from "@/components/activity-management-page";

export default function Trainings() {
  return (
    <ActivityManagementPage
      title="Riepilogo Allenamenti"
      subtitle="Gestisci le sessioni di allenamento"
      apiEndpoint="/api/courses?activityType=allenamenti"
      categoryApiEndpoint="/api/training-categories"
      itemLabel="allenamento"
      itemLabelPlural="allenamenti"
      baseRoute="/scheda-allenamento"
      idParamName="courseId"
      testIdPrefix="training"
      activityType="allenamenti"
    />
  );
}
