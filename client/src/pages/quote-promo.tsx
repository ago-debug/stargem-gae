import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListinoTab } from "@/components/quote-promo/listino-tab";
import { PromoTab } from "@/components/quote-promo/promo-tab";
import { CarnetTab } from "@/components/quote-promo/carnet-tab";
import { ConvenzioniTab } from "@/components/quote-promo/convenzioni-tab";
import { StaffRatesTab } from "@/components/quote-promo/staff-rates-tab";
import { ErrorBoundary } from "@/components/error-boundary";
import { SeasonSelector } from "@/components/season-selector";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon, HistoryIcon } from "lucide-react";

export default function QuotePromo() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | "active">(
    "active",
  );

  const { data: seasons } = useQuery<any[]>({
    queryKey: ["/api/seasons"],
  });

  const selectedSeason = seasons?.find((s) =>
    selectedSeasonId === "active"
      ? s.active || true
      : s.id === selectedSeasonId,
  );
  const activeSeason = seasons?.find((s) => s.active) || seasons?.[0];

  let isPast = false;
  let isFuture = false;
  if (selectedSeason && activeSeason && selectedSeason.id !== activeSeason.id) {
    if (
      new Date(selectedSeason.startDate).getTime() <
      new Date(activeSeason.startDate).getTime()
    ) {
      isPast = true;
    } else {
      isFuture = true;
    }
  }

  return (
    <ErrorBoundary>
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quote e Promo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Hub centrale prezzi, sconti, carnet e accordi maestri
            </p>
          </div>
          <div className="flex shrink-0 items-center rounded-lg border border-slate-100 bg-muted/50 p-2 shadow-sm">
            <SeasonSelector
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={setSelectedSeasonId}
              showLabel={true}
            />
          </div>
        </div>

        <Tabs defaultValue="listino" className="w-full">
          <div className="mb-4 flex justify-start border-b pb-4">
            <TabsList className="h-12 flex-wrap justify-start overflow-x-auto bg-slate-100 p-1 dark:bg-slate-800 sm:flex-nowrap">
              <TabsTrigger
                value="listino"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Listino prezzi
              </TabsTrigger>
              <TabsTrigger
                value="promo"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Promo e convenzioni
              </TabsTrigger>
              <TabsTrigger
                value="welfare"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Welfare
              </TabsTrigger>
              <TabsTrigger
                value="carnet"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Carnet attivi
              </TabsTrigger>
              <TabsTrigger
                value="convenzioni"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Convenzioni aziende
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="gap-2 px-6 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Tariffe Staff e Insegnanti
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Visual Feedback Banner */}
          {isPast && (
            <Alert variant="default" className="mb-6 border-border bg-muted">
              <HistoryIcon className="size-4 text-muted-foreground" />
              <AlertDescription className="font-medium text-muted-foreground">
                Stai visualizzando dati storici — Stagione{" "}
                {selectedSeason?.name}. Solo lettura.
              </AlertDescription>
            </Alert>
          )}
          {isFuture && (
            <Alert
              variant="default"
              className="mb-6 border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-300"
            >
              <InfoIcon className="size-4 text-blue-600" />
              <AlertDescription className="font-medium">
                Stai configurando una stagione futura — {selectedSeason?.name}.
                Le modifiche saranno attive dal{" "}
                {new Date(selectedSeason?.startDate).toLocaleDateString()}.
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="listino" className="mt-0 outline-none">
            <ListinoTab seasonId={selectedSeasonId} />
          </TabsContent>
          <TabsContent value="promo" className="mt-0 outline-none">
            <PromoTab seasonId={selectedSeasonId} />
          </TabsContent>
          <TabsContent value="welfare" className="mt-0 outline-none">
            <WelfareTab seasonId={selectedSeasonId} />
          </TabsContent>
          <TabsContent value="carnet" className="mt-0 outline-none">
            <CarnetTab seasonId={selectedSeasonId} />
          </TabsContent>
          <TabsContent value="convenzioni" className="mt-0 outline-none">
            <ConvenzioniTab seasonId={selectedSeasonId} />
          </TabsContent>
          <TabsContent value="staff" className="mt-0 outline-none">
            <StaffRatesTab seasonId={selectedSeasonId} />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
