import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

interface SortableHeaderProps {
  children: React.ReactNode;
  column: string;
  currentSort: SortConfig;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  children,
  column,
  currentSort,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort.field === column && currentSort.direction !== null;
  const direction = currentSort.field === column ? currentSort.direction : null;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none transition-colors group",
        isActive && "sorted-column-header font-bold",
        className
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="inline-flex shrink-0">
          {direction === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
          ) : direction === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
          )}
        </span>
      </div>
    </TableHead>
  );
}
