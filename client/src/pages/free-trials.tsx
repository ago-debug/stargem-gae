import ActivityManagementPage from "@/components/activity-management-page";

export default function FreeTrials() {
  return (
    <ActivityManagementPage
      title="Riepilogo Prove Gratuite"
      subtitle="Gestisci le lezioni di prova gratuite"
      apiEndpoint="/api/free-trials"
      categoryApiEndpoint="/api/categories"
      itemLabel="prova gratuita"
      itemLabelPlural="prove gratuite"
      baseRoute="/scheda-prova-gratuita"
      testIdPrefix="free-trial"
    />
  );
}
