import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Season {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
}

export function useSeasonAutoGenerate(seasons: Season[] | undefined, selectedSeasonId: number | "active", onSeasonChange?: (id: number | "active") => void) {
    const queryClient = useQueryClient();
    const prevSeasonId = useRef<number | "active" | null>(null);

    useEffect(() => {
        if (!seasons?.length) return;
        
        // Auto-advance season/generate next season if we are in February or later
        if (prevSeasonId.current === null && selectedSeasonId === "active") {
            const now = new Date();
            if (now.getMonth() >= 1) { // February is index 1
                const activeSeason = seasons.find(s => s.active) || seasons[0];
                const activeIdx = seasons.findIndex(s => s.id === activeSeason.id);
                
                // activeIdx - 1 is the next season because order is DESC (newest first)
                if (activeIdx > 0 && onSeasonChange) {
                    onSeasonChange(seasons[activeIdx - 1].id);
                } else if (activeIdx === 0) {
                    // Auto-generate next season
                    const yearMatch = activeSeason.name.match(/20(\d{2})\/20(\d{2})/);
                    const activeYear = yearMatch ? 2000 + parseInt(yearMatch[1]) : NaN;
                    
                    if (!isNaN(activeYear)) {
                        const nextName = `${activeYear + 1}/${activeYear + 2}`;
                        // Genera in background
                        fetch('/api/seasons', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: nextName,
                                startDate: `${activeYear + 1}-09-01T00:00:00.000Z`,
                                endDate: `${activeYear + 2}-08-31T23:59:59.000Z`,
                                active: false
                            })
                        }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
                        }).catch(err => {
                            console.error("Failed to auto-generate next season:", err);
                        });
                    }
                }
            }
        }
        prevSeasonId.current = selectedSeasonId;
    }, [selectedSeasonId, seasons, queryClient, onSeasonChange]);
}
