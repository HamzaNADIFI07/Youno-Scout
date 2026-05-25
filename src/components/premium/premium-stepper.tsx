import { Check } from "lucide-react";

type Step = {
  number: number;
  label: string;
};

type Props = {
  steps: Step[];
  current: number;
};

export function PremiumStepper({ steps, current }: Props) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium">
      {steps.map((step, index) => {
        const isDone = step.number < current;
        const isActive = step.number === current;
        const isLast = index === steps.length - 1;
        return (
          <li key={step.number} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  isDone
                    ? "border-[#ce562f] bg-[#ce562f] text-white"
                    : isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="size-3.5" aria-hidden /> : step.number}
              </span>
              <span
                className={
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-foreground/80"
                      : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <span
                aria-hidden
                className={`hidden h-px w-8 sm:block ${
                  isDone ? "bg-[#ce562f]" : "bg-border"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
