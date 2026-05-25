import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatVerdict } from "@/lib/format";
import type { IcpScore } from "@/lib/types";

type Props = {
  icp: IcpScore;
};

export function ScoreCard({ icp }: Props) {
  const verdict = formatVerdict(icp.verdict);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Target className="size-4" aria-hidden />
            Score ICP — SaaS B2B
          </CardTitle>
          <VerdictBadge tone={verdict.tone} label={verdict.label} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums">
              {icp.total}
            </span>
            <span className="text-base text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{icp.rationale}</p>
        </div>

        <div className="space-y-4">
          {icp.breakdown.map((entry) => {
            const pct = entry.maxScore === 0
              ? 0
              : Math.round((entry.score / entry.maxScore) * 100);
            return (
              <div key={entry.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{entry.category}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.score} / {entry.maxScore}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {entry.reasoning}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function VerdictBadge({
  tone,
  label,
}: {
  tone: "positive" | "neutral" | "warning" | "negative";
  label: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    positive: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    neutral: "bg-muted text-foreground ring-border",
    warning: "bg-amber-100 text-amber-900 ring-amber-200",
    negative: "bg-red-100 text-red-900 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClass[tone]}`}
    >
      {label}
    </span>
  );
}
