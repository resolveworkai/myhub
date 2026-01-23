import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  index + 1 < currentStep
                    ? 'bg-success text-success-foreground'
                    : index + 1 === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {index + 1 < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 text-center hidden sm:block',
                  index + 1 === currentStep
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-2 rounded-full transition-all',
                  index + 1 < currentStep ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center sm:hidden">
        Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
      </p>
    </div>
  );
}
