import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export interface ListPageHeaderProps {
  title: string;
  totalRecords: number;
  actions?: ReactNode;
}

export function ListPageHeader({ title, totalRecords, actions }: ListPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Badge variant="secondary" className="text-sm font-medium">
          {totalRecords} {totalRecords === 1 ? 'record' : 'record'}
        </Badge>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
