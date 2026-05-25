import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  result: AnalysisResult;
};

export function DescriptionCard({ result }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <BookOpen className="size-4" aria-hidden />
          Brief commercial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed">{result.company.longDescription}</p>

        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Proposition de valeur
            </dt>
            <dd className="mt-1 leading-relaxed">{result.company.valueProposition}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cible
            </dt>
            <dd className="mt-1 leading-relaxed">{result.company.targetAudience}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Confiance
            </dt>
            <dd className="mt-1 leading-relaxed tabular-nums">
              {Math.round(result.company.confidence * 100)}%
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
