import { OnlineTab } from "@/components/quote-promo/online-tab";
import { ErrorBoundary } from "@/components/error-boundary";
import { SeasonSelector } from "@/components/season-selector";
import { useState } from "react";

export default function PagamentiOnline() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | "active">("active");

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transazioni Online</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestione dei pagamenti transitati dai canali esterni (Stripe, WooCommerce)
            </p>
          </div>
          <div className="shrink-0 flex items-center bg-muted/50 p-2 rounded-lg border border-slate-100 shadow-sm">
            <SeasonSelector
              selectedSeasonId={selectedSeasonId}
              onSeasonChange={setSelectedSeasonId}
              showLabel={true}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <OnlineTab seasonId={selectedSeasonId} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
