import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSeasonLabel } from "@/lib/utils";
import { useSeasonAutoGenerate } from "@/hooks/use-season-auto-generate";

interface SeasonSelectorProps {
    selectedSeasonId: number | "active";
    onSeasonChange: (id: number | "active") => void;
    showLabel?: boolean;
}

export function SeasonSelector({ selectedSeasonId, onSeasonChange, showLabel = false }: SeasonSelectorProps) {
    const { data: seasons, isLoading } = useQuery<any[]>({
        queryKey: ["/api/seasons"],
    });

    // Auto-generate hook
    useSeasonAutoGenerate(seasons, selectedSeasonId, onSeasonChange);

    const handleValueChange = (val: string) => {
        if (val === "active") {
            onSeasonChange("active");
        } else {
            onSeasonChange(parseInt(val, 10));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-1.5">
                {showLabel && <span className="text-xs font-medium text-slate-500 uppercase tracking-widest px-1">Stagione</span>}
                <div className="w-[180px] h-10 bg-slate-100 animate-pulse rounded-md"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1.5 shrink-0">
            {showLabel && <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em] px-1">Stagione Fiscale</span>}
            <Select value={selectedSeasonId.toString()} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[180px] bg-white border-slate-300 shadow-sm font-medium">
                    <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
                    <SelectValue placeholder="Stagione" />
                </SelectTrigger>
                <SelectContent>
                    {seasons?.map((s: any, idx: number) => {
                        const isActiveFallback = s.active || (!seasons.find((x: any) => x.active) && idx === 0);
                        return (
                            <SelectItem 
                                key={s.id} 
                                value={isActiveFallback ? "active" : s.id.toString()} 
                                className={isActiveFallback ? "font-bold text-primary" : "font-medium text-slate-700"}
                            >
                                {getSeasonLabel(s, seasons)}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}
