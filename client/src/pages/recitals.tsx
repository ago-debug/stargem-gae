import ActivityManagementPage from "@/components/activity-management-page";

export default function Recitals() {
  return (
    <ActivityManagementPage
      title="Riepilogo Saggi"
      subtitle="Gestisci saggi e spettacoli"
      apiEndpoint="/api/recitals"
      categoryApiEndpoint="/api/recital-categories"
      itemLabel="saggio/spettacolo"
      itemLabelPlural="saggi e spettacoli"
      baseRoute="/scheda-saggio"
      testIdPrefix="recital"
    />
  );
}
