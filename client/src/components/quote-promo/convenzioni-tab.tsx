import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Building2, ChevronDown, ChevronRight, Plus, Users, Landmark, Shield, GraduationCap, Building, Briefcase } from "lucide-react";
import type { CompanyAgreement } from "@shared/schema";

interface ConvenzioniTabProps {
  seasonId: number | "active";
}

export function ConvenzioniTab({ seasonId }: ConvenzioniTabProps) {
  const [filter, setFilter] = useState("all");

  const { data: convenzioni, isLoading } = useQuery<CompanyAgreement[]>({
    queryKey: ["/api/company-agreements", seasonId, { active: true }],
    queryFn: async () => {
      const res = await fetch(`/api/company-agreements?seasonId=${seasonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filteredConvenzioni = convenzioni?.filter(c => filter === "all" || c.companyType === filter);

  const getTypeStyle = (type: string | null) => {
    switch (type) {
      case "universita": return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Landmark className="w-4 h-4 mr-1" />, label: "Università" };
      case "forze_ordine": return { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <Shield className="w-4 h-4 mr-1" />, label: "Forze dell'Ordine" };
      case "azienda": return { color: "bg-violet-100 text-violet-800 border-violet-200", icon: <Building className="w-4 h-4 mr-1" />, label: "Azienda" };
      case "scuola": return { color: "bg-orange-100 text-orange-800 border-orange-200", icon: <GraduationCap className="w-4 h-4 mr-1" />, label: "Scuola" };
      case "accademia": return { color: "bg-teal-100 text-teal-800 border-teal-200", icon: <Building2 className="w-4 h-4 mr-1" />, label: "Accademia" };
      case "studio_professionale": return { color: "bg-slate-100 text-slate-800 border-slate-200", icon: <Briefcase className="w-4 h-4 mr-1" />, label: "Studio Professionale" };
      default: return { color: "bg-slate-100 text-slate-800 border-slate-200", icon: <Building2 className="w-4 h-4 mr-1" />, label: "Altro" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Convenzioni e Partnership
          </h2>
          <p className="text-sm text-muted-foreground">Enti e aziende convenzionati con sconti riservati a iscritti e dipendenti</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="universita">Università</SelectItem>
              <SelectItem value="forze_ordine">Forze dell'Ordine</SelectItem>
              <SelectItem value="azienda">Aziende</SelectItem>
              <SelectItem value="scuola">Scuole</SelectItem>
              <SelectItem value="accademia">Accademie</SelectItem>
              <SelectItem value="studio_professionale">Studi Professionali</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Nuova Convenzione
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2"/><Skeleton className="h-4 w-1/2"/></CardHeader>
              <CardContent><Skeleton className="h-20 w-full"/></CardContent>
            </Card>
          ))
        ) : filteredConvenzioni?.length ? (
          filteredConvenzioni.map(conv => {
            const style = getTypeStyle(conv.companyType);
            return (
              <Card key={conv.id} className="shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-lg text-slate-800 leading-tight flex-1">{conv.companyName}</CardTitle>
                    {conv.isActive && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">Attiva</Badge>}
                  </div>
                  <Badge variant="outline" className={`mt-2 w-fit flex items-center ${style.color}`}>
                     {style.icon} {style.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Sconto Corsi:</span>
                    <span className="font-semibold text-emerald-700">{conv.discountCourses}%</span>
                    
                    <span className="text-muted-foreground">Sconto Merch:</span>
                    <span className="font-semibold text-emerald-700">{conv.discountMerch}%</span>

                    <span className="text-muted-foreground">Esclude OPEN:</span>
                    <span className="font-medium">{conv.excludeOpen ? "SÌ" : "NO"}</span>

                    <span className="text-muted-foreground">Verifica:</span>
                    <span className="font-medium truncate" title={conv.verificationNotes || 'Altro'}>{conv.verificationNotes || 'Non specificato'}</span>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-md">
                     <span className="flex items-center text-xs font-semibold text-slate-700 mb-1">
                        <Users className="w-3.5 h-3.5 mr-1" /> Chi può usarla:
                     </span>
                     <p className="text-sm text-slate-600 line-clamp-2">{conv.eligibleWho || "Tutti gli afferenti"}</p>
                  </div>

                  {conv.specialRules && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="h-8 p-0 px-2 w-full flex justify-between text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50">
                          <span className="text-xs font-semibold">Mostra regole speciali</span>
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 text-xs text-slate-500 italic bg-amber-50 p-3 rounded border border-amber-100">
                        {conv.specialRules}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50 pt-3 flex justify-between items-center border-t">
                  <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Restrizioni Extra</span>
                     <span className="text-xs font-mono text-slate-700">{conv.excludeOtherPromos ? "Non cumulabile" : "Cumulabile"}</span>
                  </div>
                  <Button variant="outline" size="sm" className="hidden border-indigo-200 text-indigo-700">Modifica</Button>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full h-32 flex items-center justify-center border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
             Nessuna convenzione attiva trovata.
          </div>
        )}
      </div>
    </div>
  );
}
