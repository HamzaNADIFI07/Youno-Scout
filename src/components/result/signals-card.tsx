import { Check, Minus, Slash, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Signal } from "@/lib/types";

type Props = {
  signals: Signal[];
};

export function SignalsCard({ signals }: Props) {
  const sorted = [...signals].sort((a, b) => {
    if (a.selected !== b.selected) return a.selected ? -1 : 1;
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return b.weight - a.weight;
  });

  const selectedSignals = signals.filter((s) => s.selected);
  const detectedCount = selectedSignals.filter((s) => s.detected).length;
  const excludedCount = signals.length - selectedSignals.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Zap className="size-4" aria-hidden />
            Signaux GTM
          </CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {detectedCount} / {selectedSignals.length} renseignés
            {excludedCount > 0 ? ` · ${excludedCount} exclus` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sorted.map((signal) => {
            const inactive = !signal.selected;
            return (
              <li
                key={signal.id}
                className="flex items-start gap-3"
                data-detected={signal.detected}
                data-selected={signal.selected}
              >
                <div
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                    inactive
                      ? "bg-muted/60 text-muted-foreground/60"
                      : signal.detected
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {inactive ? (
                    <Slash className="size-3" aria-hidden />
                  ) : signal.detected ? (
                    <Check className="size-3" aria-hidden />
                  ) : (
                    <Minus className="size-3" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p
                      className={`text-sm font-medium ${
                        inactive
                          ? "text-muted-foreground/70 line-through decoration-muted-foreground/40"
                          : "text-foreground"
                      }`}
                    >
                      {signal.label}
                    </p>
                    {!inactive ? (
                      <span className="text-sm text-foreground/85">
                        :{" "}
                        <span
                          className={
                            signal.detected
                              ? "font-semibold text-[#ce562f]"
                              : "italic text-muted-foreground"
                          }
                        >
                          {signal.value ?? "Non renseigné"}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  {inactive ? (
                    <p className="mt-0.5 text-xs text-muted-foreground/70">
                      Exclu de l’analyse
                    </p>
                  ) : signal.evidence ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {signal.evidence}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
