import ActivityManagementPage from "@/components/activity-management-page";

export default function SingleLessons() {
  return (
    <ActivityManagementPage
      title="Lezioni Singole"
      subtitle="Gestisci le lezioni singole o drop-in"
      apiEndpoint="/api/single-lessons"
      categoryApiEndpoint="/api/categories"
      itemLabel="lezione singola"
      itemLabelPlural="lezioni singole"
      testIdPrefix="single-lesson"
    />
  );
}
