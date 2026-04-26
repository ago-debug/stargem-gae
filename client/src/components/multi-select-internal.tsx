import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "./multi-select-status";

export const INTERNAL_TAGS = [
  { id: "spingere", name: "SPINGERE", color: "#4f46e5" },
  { id: "chiudere", name: "CHIUDERE", color: "#6366f1" },
  { id: "con_selezione", name: "CON SELEZIONE", color: "#8b5cf6" },
  { id: "pagato", name: "PAGATO", color: "#7c3aed" },
  { id: "privato", name: "PRIVATO", color: "#6d28d9" },
  { id: "ultimi_posti", name: "ULTIMI POSTI", color: "#5b21b6" },
];

interface MultiSelectInternalProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export function MultiSelectInternal({ selectedTags, onChange }: MultiSelectInternalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: customList } = useQuery<any>({
    queryKey: ["/api/custom-lists/tag_interni"],
  });

  const activeTags = customList?.items?.length > 0 
    ? customList.items.map((i: any) => ({ id: i.id, name: i.value, color: i.color })) 
    : INTERNAL_TAGS;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTag = (name: string) => {
    if (selectedTags.includes(name)) {
      onChange(selectedTags.filter((t) => t !== name));
    } else {
      onChange([...selectedTags, name]);
    }
  };

  const removeTag = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    onChange(selectedTags.filter((t) => t !== name));
  };

  return (
    <div className="space-y-2 flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Label>Interno Corso</Label>
        <InlineListEditorDialog listCode="tag_interni" listName="Interno Corso" showColors={true} />
      </div>
      <div className="relative" ref={containerRef}>
        <div
        className="flex min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent/50 cursor-pointer transition-colors focus-within:ring-1 focus-within:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 items-center flex-1 pr-2 overflow-hidden">
          {selectedTags.length === 0 ? (
            <span className="text-muted-foreground">Seleziona interno corso...</span>
          ) : (
            selectedTags.map((tagName) => {
              const tag = activeTags.find((t: any) => t.name === tagName);
              return (
                <StatusBadge
                  key={tagName}
                  name={tagName}
                  color={tag?.color}
                  className="flex items-center gap-1"
                />
              );
            })
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-xl z-[100] py-2 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 overflow-hidden">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
            Tag Interni
          </div>
          <div className="max-h-60 overflow-y-auto px-1">
            {activeTags.map((tag: any) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <div
                  key={tag.id}
                  className={cn(
                    "px-3 py-1.5 text-sm cursor-pointer rounded flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors",
                    isSelected && "bg-indigo-50/50"
                  )}
                  onClick={() => toggleTag(tag.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className={cn(isSelected ? "font-semibold text-indigo-900" : "text-slate-700")}>
                      {tag.name}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-muted-foreground">
                      #{selectedTags.indexOf(tag.name) + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
