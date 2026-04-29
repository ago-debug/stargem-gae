import { ReactNode } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface ActivityAccordionCardProps {
  id: string; // Used for accordion value
  activity: any;
  icon: React.ElementType;
  enrollmentsCount: number;
  badgeLabelPlural: string;
  badgeLabelSingular: string;
  linkHref: string;
  testIdPrefix: string;
  children: ReactNode;
}

export function ActivityAccordionCard({
  id,
  activity,
  icon: Icon,
  enrollmentsCount,
  badgeLabelPlural,
  badgeLabelSingular,
  linkHref,
  testIdPrefix,
  children
}: ActivityAccordionCardProps) {
  const isInactive = !activity.active;

  return (
    <AccordionItem value={id} className="border-none shadow-sm rounded-lg overflow-hidden mb-4 bg-transparent">
      <Card className={`overflow-hidden transition-all duration-200 border-none shadow-none ${isInactive ? "opacity-80" : ""}`}>
        <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:bg-muted/70 border rounded-t-lg data-[state=closed]:rounded-b-lg">
          <CardHeader className={`w-full bg-muted/30 transition-colors p-4 ${isInactive ? "grayscale-[0.5]" : ""}`}>
            <div className="flex items-start justify-between w-full pr-4 text-left">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-lg font-semibold ${isInactive ? "text-muted-foreground" : ""}`}>{activity.name}</h3>
                    {isInactive && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Storico</Badge>
                    )}
                  </div>
                  {activity.sku && (
                    <p className="text-sm text-muted-foreground">SKU: {activity.sku}</p>
                  )}
                  {activity.dayOfWeek && activity.startTime && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.dayOfWeek} • {activity.startTime}
                      {activity.endTime && ` - ${activity.endTime}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Badge variant="secondary">
                  {enrollmentsCount} {enrollmentsCount === 1 ? badgeLabelSingular : badgeLabelPlural}
                </Badge>
                <Link href={linkHref}>
                  <Button size="sm" className="bg-[#2c3e50] text-[#e0e0e0] hover:bg-[#34495e]" data-testid={`button-${testIdPrefix}-${activity.id}`}>
                    Scheda
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
        </AccordionTrigger>
        <AccordionContent className="p-0 border-x border-b rounded-b-lg">
          <CardContent className="pt-4">
            {children}
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
