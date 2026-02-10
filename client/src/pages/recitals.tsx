import ActivityManagementPage from "@/components/activity-management-page";

export default function Recitals() {
  return (
    <ActivityManagementPage
      title="Saggi"
      subtitle="Gestisci saggi e spettacoli"
      apiEndpoint="/api/recitals"
      categoryApiEndpoint="/api/recital-categories"
      itemLabel="saggio"
      itemLabelPlural="saggi"
      testIdPrefix="recital"
    />
  );
}
