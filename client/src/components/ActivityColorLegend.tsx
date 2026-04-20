import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Info } from "lucide-react";
const ACTIVITY_LEGEND = [
  { label: "Corsi", badge: "CRS", color: null, isCategory: true, note: "da categoria" },
  { label: "Allenamenti/Prove", badge: "ALL", color: "#1e40af" },
  { label: "Lezioni Individuali", badge: "IND", color: "#7c3aed" },
  { label: "Workshop", badge: "WS", color: "#c2410c" },
  { label: "Domeniche", badge: "DOM", color: "#a16207" },
  { label: "Saggi", badge: "SAG", color: "#be185d" },
  { label: "Vacanze Studio", badge: "VAC", color: "#15803d" },
  { label: "Campus", badge: "CAM", color: "#0369a1" },
  { label: "Affitti", badge: "AFT", color: "#374151" },
  { label: "Festività Nazionali", badge: "FES", color: "#DC2626" },
  { label: "Chiusure Studio / Ferie", badge: "CHI", color: "#9D174D" },
  { label: "Note / Generico", badge: "NOT", color: "#6b7280" },
];

export function ActivityColorLegend({ variant = "card" }: { variant?: "card" | "popover" }) {
  const LegendItems = () => (
    <div className="flex flex-col gap-2">
      {ACTIVITY_LEGEND.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {item.color ? (
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          ) : (
            <Palette className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          
          <span 
            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={item.color ? {
              backgroundColor: `${item.color}20`,
              color: item.color,
              borderLeft: `3px solid ${item.color}`
            } : {
              backgroundColor: "#6b728020",
              color: "#374151",
              borderLeft: "3px solid #6b7280"
            }}
          >
            {item.badge}
          </span>
          
          <span className="text-sm font-medium">
            {item.label}
            {item.note && <span className="text-muted-foreground font-normal ml-1">({item.note})</span>}
          </span>
        </div>
      ))}
    </div>
  );

  if (variant === "popover") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[120px] justify-center font-normal bg-transparent border-slate-300">
            <Palette className="w-4 h-4 mr-2" />
            Legenda
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4" align="end">
          <div className="space-y-3">
            <h4 className="font-medium text-sm border-b pb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Legenda Colori Attività
            </h4>
            <div className="grid grid-cols-1 gap-3 content-start">
              <LegendItems />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Card className="bg-slate-50/50 border-dashed shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex self-start mt-0.5">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Legenda Colori e Badge
            </h4>
            <LegendItems />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
