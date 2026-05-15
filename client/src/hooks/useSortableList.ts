import { useState, useMemo } from "react";
import { SortConfig, SortDirection } from "@/components/shared/SortableHeader";

export function sortArray<T>(data: T[], sortConfig: SortConfig, getValueFn?: (item: T, field: string) => any): T[] {
  if (!sortConfig.field || !sortConfig.direction) return data;

  return [...data].sort((a: any, b: any) => {
    let aVal = getValueFn ? getValueFn(a, sortConfig.field) : a[sortConfig.field];
    let bVal = getValueFn ? getValueFn(b, sortConfig.field) : b[sortConfig.field];

    if (sortConfig.field === "lastName" || sortConfig.field === "cognome") {
       const aNome = getValueFn ? getValueFn(a, "firstName") : (a.firstName || a.nome || "");
       const bNome = getValueFn ? getValueFn(b, "firstName") : (b.firstName || b.nome || "");
       if (aVal === bVal) {
           aVal = aNome;
           bVal = bNome;
       }
    }

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let comparison = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
      comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), "it", { sensitivity: "base", numeric: true });
    }

    return sortConfig.direction === "desc" ? -comparison : comparison;
  });
}

export function useSortableList<T>(
  data: T[],
  defaultField = "",
  defaultDirection: SortDirection = "asc",
  getValueFn?: (item: T, field: string) => any
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: defaultField,
    direction: defaultField ? defaultDirection : null,
  });

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        if (prev.direction === null) return { field, direction: "asc" };
        if (prev.direction === "asc") return { field, direction: "desc" };
        return { field, direction: null };
      }
      return { field, direction: "asc" };
    });
  };

  const sortedData = useMemo(() => sortArray(data, sortConfig, getValueFn), [data, sortConfig, getValueFn]);

  return { sortedData, sortConfig, handleSort, setSortConfig };
}
