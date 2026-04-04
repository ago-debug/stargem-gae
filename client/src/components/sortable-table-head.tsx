import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
  "data-testid"?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
  "data-testid": testId,
}: SortableTableHeadProps) {
  const isActive = currentSort.key === sortKey && currentSort.direction !== null;
  const direction = currentSort.key === sortKey ? currentSort.direction : null;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none transition-colors",
        isActive && "sorted-column-header",
        className
      )}
      onClick={() => onSort(sortKey)}
      data-testid={testId}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        <span className="inline-flex">
          {direction === "asc" ? (
            <ArrowUp className="w-3 h-3 text-amber-700 dark:text-amber-400" />
          ) : direction === "desc" ? (
            <ArrowDown className="w-3 h-3 text-amber-700 dark:text-amber-400" />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

export function useSortableTable<T>(defaultKey = "", defaultDirection: SortDirection = "asc") {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultKey,
    direction: defaultKey ? defaultDirection : null,
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === null) return { key, direction: "asc" };
        if (prev.direction === "asc") return { key, direction: "desc" };
        return { key, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const sortItems = (data: T[], getValueFn: (item: T, key: string) => any): T[] => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = getValueFn(a, sortConfig.key);
      const bVal = getValueFn(b, sortConfig.key);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "it", { sensitivity: "base" });
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  };

  const isSortedColumn = (key: string) => sortConfig.key === key && sortConfig.direction !== null;

  return { sortConfig, handleSort, sortItems, isSortedColumn };
}
