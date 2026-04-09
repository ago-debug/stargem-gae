import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ListinoTab } from "@/components/quote-promo/listino-tab";
import { PromoTab } from "@/components/quote-promo/promo-tab";
import { WelfareTab } from "@/components/quote-promo/welfare-tab";
import { CarnetTab } from "@/components/quote-promo/carnet-tab";
import { AccordiTab } from "@/components/quote-promo/accordi-tab";
import { ConvenzioniTab } from "@/components/quote-promo/convenzioni-tab";

export default function QuotePromo() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quote e Promo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hub centrale prezzi, sconti, carnet e accordi maestri
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5 text-primary border-primary/20">
          Stagione 2025-2026
        </Badge>
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

        <TabsContent value="listino" className="mt-0 outline-none">
          <ListinoTab />
        </TabsContent>
        <TabsContent value="promo" className="mt-0 outline-none">
          <PromoTab />
        </TabsContent>
        <TabsContent value="welfare" className="mt-0 outline-none">
          <WelfareTab />
        </TabsContent>
        <TabsContent value="carnet" className="mt-0 outline-none">
          <CarnetTab />
        </TabsContent>
        <TabsContent value="convenzioni" className="mt-0 outline-none">
          <ConvenzioniTab />
        </TabsContent>
        <TabsContent value="accordi" className="mt-0 outline-none">
          <AccordiTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
