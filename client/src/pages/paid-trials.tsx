import ActivityManagementPage from "@/components/activity-management-page";

export default function PaidTrials() {
  return (
    <ActivityManagementPage
      title="Riepilogo Prove a Pagamento"
      subtitle="Gestisci le lezioni di prova a pagamento"
      apiEndpoint="/api/paid-trials"
      categoryApiEndpoint="/api/categories"
      itemLabel="prova a pagamento"
      itemLabelPlural="prove a pagamento"
      testIdPrefix="paid-trial"
    />
  );
}
