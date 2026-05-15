import { AlertTriangle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { validatePhone } from "@/lib/utils/phoneValidator";

interface PhoneBadgeProps {
  phone: string | null | undefined;
}

export function PhoneBadge({ phone }: PhoneBadgeProps) {
  if (!phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { valid, formatted, error } = validatePhone(phone);

  if (valid) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatted || phone}</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help w-fit">
            <span className="font-medium text-destructive">{formatted || phone}</span>
            <Badge variant="destructive" className="h-5 px-1.5 flex items-center gap-1 shadow-sm text-[10px]">
              <AlertTriangle className="w-3 h-3" />
              ERR
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-destructive text-destructive-foreground font-bold">
          <p>{error}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
