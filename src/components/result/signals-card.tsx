import { Check, Minus, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Signal } from "@/lib/types";

type Props = {
  signals: Signal[];
};

export function SignalsCard({ signals }: Props) {
  const sorted = [...signals].sort((a, b) => {
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return b.weight - a.weight;
  });

  const detectedCount = signals.filter((s) => s.detected).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Zap className="size-4" aria-hidden />
            Signaux GTM
          </CardTitle>
          <span className="text-xs tabular-nums text-muted-foreground">
            {detectedCount} / {signals.length} détectés
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sorted.map((signal) => (
            <li
              key={signal.id}
              className="flex items-start gap-3"
              data-detected={signal.detected}
            >
              <div
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                  signal.detected
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {signal.detected ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  <Minus className="size-3" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    signal.detected ? "" : "text-muted-foreground"
                  }`}
                >
                  {signal.label}
                </p>
                {signal.evidence ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {signal.evidence}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
