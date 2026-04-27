import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Edit } from "lucide-react";
import { useCustomListValues } from "@/hooks/use-custom-list";
import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";

interface MultiSelectCustomListProps {
  systemName: string;
  listName: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function MultiSelectCustomList({ systemName, listName, selectedValues, onChange, className = "" }: MultiSelectCustomListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const values = useCustomListValues(systemName);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const removeValue = (value: string) => {
    onChange(selectedValues.filter(v => v !== value));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="font-semibold text-slate-800 shrink-0 uppercase">{listName}</label>
        <InlineListEditorDialog 
          listCode={systemName} 
          listName={listName} 
          showColors={false} 
          penninoType="tipo A"
          trigger={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-5 w-5"
            >
              <Edit className="w-3 h-3 sidebar-icon-gold" />
            </Button>
          }
        />
      </div>

      <div className="relative">
        <div
          className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm cursor-pointer flex items-center flex-wrap gap-1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {(!selectedValues || selectedValues.length === 0) ? (
            <span className="text-muted-foreground">Seleziona {listName.toLowerCase()}...</span>
          ) : (
            selectedValues.map((val) => (
              <Badge key={val} variant="outline" className="text-xs bg-slate-100 flex items-center gap-1">
                {val}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeValue(val); }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            <div className="max-h-48 overflow-y-auto p-1">
              <div
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-slate-100 text-muted-foreground italic"
                onClick={() => { onChange([]); setIsDropdownOpen(false); }}
              >
                (Nessuna)
              </div>
              {values.map((val) => {
                const isSelected = selectedValues.includes(val);
                return (
                  <div
                    key={val}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-slate-100 flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleValue(val)}
                  >
                    <span>{val}</span>
                    {isSelected && <span className="text-xs text-muted-foreground">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  );
}

