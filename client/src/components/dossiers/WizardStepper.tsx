import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type StepStatus = 'pending' | 'completed' | 'blocked' | 'current';

export interface WizardStepDef {
  name: string;
  label: string;
  icon: React.ElementType;
  status: StepStatus;
  blockingReason?: string;
}

interface WizardStepperProps {
  steps: WizardStepDef[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export function WizardStepper({ steps, currentStepIndex, onStepClick }: WizardStepperProps) {
  return (
    <div className="w-full mb-8">
      {/* Mobile View */}
      <div className="md:hidden text-center mb-4">
        <p className="text-sm font-medium text-muted-foreground">
          Step {currentStepIndex + 1} di {steps.length}
        </p>
        <h3 className="text-lg font-semibold">{steps[currentStepIndex]?.label}</h3>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between w-full relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isBlocked = step.status === 'blocked';

          let circleClass = "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 cursor-default bg-background ";
          
          if (isCompleted) {
            circleClass += "border-green-500 bg-green-50 text-green-600";
          } else if (isCurrent) {
            circleClass += "border-primary bg-primary text-primary-foreground";
          } else if (isBlocked) {
            circleClass += "border-destructive bg-destructive/10 text-destructive";
          } else {
            circleClass += "border-muted text-muted-foreground";
          }

          if (onStepClick && index < currentStepIndex) {
            circleClass += " cursor-pointer hover:ring-2 hover:ring-ring hover:ring-offset-2";
          }

          const stepElement = (
            <div 
              key={step.name} 
              className="flex flex-col items-center gap-2 group"
              onClick={() => {
                if (onStepClick && index < currentStepIndex) {
                  onStepClick(index);
                }
              }}
            >
              <div className={circleClass}>
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isBlocked ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-sm font-medium absolute top-12 whitespace-nowrap",
                isCurrent ? "text-primary" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );

          if (isBlocked && step.blockingReason) {
            return (
              <TooltipProvider key={step.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {stepElement}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm text-destructive">{step.blockingReason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return stepElement;
        })}
      </div>
    </div>
  );
}
