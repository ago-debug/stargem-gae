import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TeamNote } from "@shared/schema";

export function PageNotesIndicator() {
    const [location] = useLocation();

    // Rimuovi query string e hash per ottenere solo il base path
    const targetUrl = location.split('?')[0].split('#')[0];

    const { data: notes = [] } = useQuery<TeamNote[]>({
        queryKey: ["/api/team-notes", targetUrl],
        queryFn: async () => {
            return apiRequest("GET", `/api/team-notes?targetUrl=${encodeURIComponent(targetUrl)}`);
        },
        // Rendi il refetch più reattivo se cambiamo pagina spesso
        staleTime: 30000,
    });

    const activeNotesCount = notes.length;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
                    data-testid="page-notes-indicator"
                    onClick={() => {
                        // Trigger custom event to open the notes overlay and force add mode
                        document.dispatchEvent(new CustomEvent('toggle-page-notes-overlay', { detail: { openAdding: true } }));
                    }}
                >
                    <Pin className={`w-4 h-4 ${activeNotesCount > 0 ? "text-green-600 dark:text-green-500 fill-green-100 dark:fill-green-900/30" : "text-muted-foreground"}`} />
                    {activeNotesCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white border-2 border-background">
                            {activeNotesCount}
                        </span>
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                {activeNotesCount > 0
                    ? `${activeNotesCount} note di pagina attive in questa sezione`
                    : "Nessuna nota in questa sezione. Clicca per aggiungere."}
            </TooltipContent>
        </Tooltip>
    );
}
