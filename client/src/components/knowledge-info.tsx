import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Knowledge } from "@shared/schema";

interface KnowledgeInfoProps {
  id: string;
}

export function KnowledgeInfo({ id }: KnowledgeInfoProps) {
  const { data: items = [] } = useQuery<Knowledge[]>({
    queryKey: ["/api/knowledge"],
    staleTime: 1000 * 60 * 5,
  });

  const item = items.find(k => k.id.toLowerCase() === id.toLowerCase());
  
  if (!item) return null;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer" 
          data-testid={`info-${id}`}
        >
          <Info className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            {item.titolo}
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {item.descrizione || "Nessuna descrizione disponibile."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
