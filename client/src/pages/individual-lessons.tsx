import ActivityManagementPage from "@/components/activity-management-page";

export default function IndividualLessons() {
  return (
    <ActivityManagementPage
      title="Riepilogo Lezioni Individuali"
      subtitle="Gestisci le lezioni private one-to-one"
      apiEndpoint="/api/courses?activityType=prenotazioni"
      categoryApiEndpoint="/api/individual-lesson-categories"
      itemLabel="lezione individuale"
      itemLabelPlural="lezioni individuali"
      baseRoute="/scheda-lezione-individuale"
      testIdPrefix="individual-lesson"
      activityType="prenotazioni"
    />
  );
}
