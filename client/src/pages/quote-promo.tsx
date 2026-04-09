import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListinoTab } from "@/components/quote-promo/listino-tab";
import { PromoTab } from "@/components/quote-promo/promo-tab";
import { WelfareTab } from "@/components/quote-promo/welfare-tab";
import { CarnetTab } from "@/components/quote-promo/carnet-tab";
import { AccordiTab } from "@/components/quote-promo/accordi-tab";
import { ConvenzioniTab } from "@/components/quote-promo/convenzioni-tab";
import { ErrorBoundary } from "@/components/error-boundary";
import { SeasonSelector } from "@/components/season-selector";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon, HistoryIcon } from "lucide-react";

export default function QuotePromo() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | "active">("active");

  const { data: seasons } = useQuery<any[]>({
    queryKey: ["/api/seasons"],
  });

  const selectedSeason = seasons?.find(s => selectedSeasonId === "active" ? (s.active || true) : s.id === selectedSeasonId);
  const activeSeason = seasons?.find(s => s.active) || seasons?.[0];

  let isPast = false;
  let isFuture = false;
  if (selectedSeason && activeSeason && selectedSeason.id !== activeSeason.id) {
    if (new Date(selectedSeason.startDate).getTime() < new Date(activeSeason.startDate).getTime()) {
      isPast = true;
    } else {
      isFuture = true;
    }
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quote e Promo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hub centrale prezzi, sconti, carnet e accordi maestri
          </p>
        </div>
        <div className="shrink-0 flex items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100 shadow-sm">
          <SeasonSelector
            selectedSeasonId={selectedSeasonId}
            onSeasonChange={setSelectedSeasonId}
            showLabel={true}
          />
        </div>
      </div>

      <Tabs defaultValue="listino" className="w-full">
        <div className="flex justify-start border-b pb-4 mb-4">
          <TabsList className="bg-slate-100 p-1 h-12 flex-wrap sm:flex-nowrap justify-start overflow-x-auto">
            <TabsTrigger value="listino" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Listino prezzi
            </TabsTrigger>
            <TabsTrigger value="promo" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Promo e convenzioni
            </TabsTrigger>
            <TabsTrigger value="welfare" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Welfare
            </TabsTrigger>
            <TabsTrigger value="carnet" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Carnet attivi
            </TabsTrigger>
            <TabsTrigger value="convenzioni" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Convenzioni aziende
            </TabsTrigger>
            <TabsTrigger value="accordi" className="px-6 gap-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Accordi maestri
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visual Feedback Banner */}
        {isPast && (
          <Alert variant="default" className="mb-6 bg-slate-50 border-slate-200">
            <HistoryIcon className="h-4 w-4 text-slate-500" />
            <AlertDescription className="text-slate-600 font-medium">
              Stai visualizzando dati storici — Stagione {selectedSeason?.name}. Solo lettura.
            </AlertDescription>
          </Alert>
        )}
        {isFuture && (
          <Alert variant="default" className="mb-6 bg-blue-50/50 border-blue-200 text-blue-800">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="font-medium">
              Stai configurando una stagione futura — {selectedSeason?.name}. Le modifiche saranno attive dal {new Date(selectedSeason?.startDate).toLocaleDateString()}.
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
          <WelfareTab />
        </TabsContent>
        <TabsContent value="carnet" className="mt-0 outline-none">
          <CarnetTab seasonId={selectedSeasonId} />
        </TabsContent>
        <TabsContent value="convenzioni" className="mt-0 outline-none">
          <ConvenzioniTab seasonId={selectedSeasonId} />
        </TabsContent>
        <TabsContent value="accordi" className="mt-0 outline-none">
          <AccordiTab seasonId={selectedSeasonId} />
        </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
}
