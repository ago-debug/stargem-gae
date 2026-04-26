// PENNINO A: showColors=false (default) | NO multi-selezione | lista semplice
// PENNINO B: showColors=true | SÌ multi-selezione | lista colorata
// PENNINO C: showColors=true | NO multi-selezione | colore assegnato
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CustomList, CustomListItem } from "@shared/schema";

interface InlineListEditorProps {
  listCode: string;
  listName: string;
  showColors?: boolean;
}

export function InlineListEditor({ listCode, listName, showColors = false }: InlineListEditorProps) {
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#4f46e5");

  const { data: lists, isLoading } = useQuery<(CustomList & { items: CustomListItem[] })[]>({
    queryKey: ["/api/custom-lists"],
    staleTime: 0
  });

  const listData = lists?.find(l => l.systemName === listCode || l.systemCode === listCode);

  const createMutation = useMutation({
    mutationFn: async (val: string) => {
      if (!listData) throw new Error("List not found");
      const maxOrder = listData.items?.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0) || 0;
      await apiRequest("POST", `/api/custom-lists/${listData.id}/items`, { value: val, sortOrder: maxOrder + 1, active: true, color: showColors ? newColor : null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${listCode}`] });
      setNewValue("");
      toast({ title: `Voce aggiunta a ${listName}` });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      if (!listData) throw new Error("List not found");
      await apiRequest("DELETE", `/api/custom-lists/${listData.id}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${listCode}`] });
    }
  });

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!listData) return <div className="p-4 text-sm text-red-500">Lista non trovata</div>;

  return (
    <div className="flex flex-col gap-3 p-2 w-72">
      <h3 className="font-semibold text-sm border-b pb-2 shrink-0">{listName}</h3>
      <div className="flex gap-2 shrink-0">
        {showColors && (
          <Input 
            type="color" 
            value={newColor} 
            onChange={(e) => setNewColor(e.target.value)}
            className="w-8 h-8 p-0 border-0 cursor-pointer shrink-0"
            title="Colore"
          />
        )}
        <Input 
          size={1}
          placeholder="Nuova voce..." 
          value={newValue} 
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newValue.trim()) createMutation.mutate(newValue.trim());
          }}
          className="h-8 text-sm"
        />
        <Button 
          size="sm" 
          onClick={() => { if (newValue.trim()) createMutation.mutate(newValue.trim()) }}
          disabled={!newValue.trim() || createMutation.isPending}
          className="h-8 px-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1 mt-2 pr-1" style={{ maxHeight: "250px", overflowY: "auto", overscrollBehavior: "contain" }}>
        {listData.items?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(item => (
          <div key={item.id} className="flex justify-between items-center group rounded-md hover:bg-slate-50 px-2 py-1">
            {showColors && item.color ? (
              <div 
                className="w-3 h-3 rounded-full shrink-0 mr-2" 
                style={{ backgroundColor: item.color }} 
              />
            ) : null}
            <div className="flex items-center truncate">
              {showColors && item.color ? (
                <div className="w-3 h-3 rounded-full shrink-0 mr-2" style={{ backgroundColor: item.color }} />
              ) : null}
              <span className="text-sm truncate">{item.value}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => { if (confirm(`Eliminare "${item.value}"?`)) deleteMutation.mutate(item.id) }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {(!listData.items || listData.items.length === 0) && (
           <p className="text-xs text-muted-foreground text-center py-2">Nessuna voce.</p>
        )}
      </div>
    </div>
  );
}
