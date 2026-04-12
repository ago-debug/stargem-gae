import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePriceFromMatrix } from "@/hooks/use-price-from-matrix";

interface PriceTagProps {
  category: string;
  courseCount?: number;
  className?: string;
}

export function PriceTag({ category, courseCount, className }: PriceTagProps) {
  const { finalPrice, note, isLoading } = usePriceFromMatrix({ category, courseCount });

  if (isLoading) return <Skeleton className="h-4 w-16" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className}>
            {finalPrice > 0 ? `${finalPrice}€` : "—"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{note}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
