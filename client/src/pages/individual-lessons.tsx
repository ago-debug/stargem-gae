import ActivityManagementPage from "@/components/activity-management-page";

export default function IndividualLessons() {
  return (
    <ActivityManagementPage
      title="Riepilogo Lezioni Individuali"
      subtitle="Gestisci le lezioni private one-to-one"
      apiEndpoint="/api/courses?activityType=lezione_individuale"
      categoryApiEndpoint="/api/individual-lesson-categories"
      itemLabel="lezione individuale"
      itemLabelPlural="lezioni individuali"
      baseRoute="/scheda-lezione-individuale"
      idParamName="courseId"
      testIdPrefix="individual-lesson"
      activityType="individual_lesson"
    />
  );
}
